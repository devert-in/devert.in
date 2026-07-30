"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp, deleteField } from "firebase/firestore";

const AuthContext = createContext();

function getTier(xp = 0) {
  if (xp >= 10000) return { name: "LEGEND",    color: "#FFD700" };
  if (xp >= 5000)  return { name: "ELITE",     color: "#FF6430" };
  if (xp >= 2000)  return { name: "ARCHITECT", color: "#00FFFF" };
  if (xp >= 500)   return { name: "BUILDER",   color: "#00FF41" };
  return                  { name: "RECRUIT",   color: "#888888" };
}

function makeHandle(user) {
  const base = user.displayName
    ? user.displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    : user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return base || "dev_" + user.uid.slice(0, 6);
}

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading]   = useState(true);
  // Derived from the `admin` custom auth claim (see scripts/set-admin-claim.mjs)
  // - the actual authority is the matching check in firestore.rules/storage.rules;
  // this just drives what the client renders/redirects. Resolves asynchronously
  // (a token fetch), independently of `loading` above - adminChecked lets
  // callers (the admin route's gate) wait for it instead of racing it.
  const [isAdmin, setIsAdmin]           = useState(false);
  const [adminChecked, setAdminChecked] = useState(false);

  useEffect(() => {
    console.log("[Auth Debug] AuthContext mounted, setting up onAuthStateChanged listener...");
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      console.log("[Auth Debug] onAuthStateChanged fired. User:", currentUser ? currentUser.uid : "null");
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setIsAdmin(false);
        setAdminChecked(true);
        setLoading(false);
        return;
      }
      try {
        const token = await currentUser.getIdTokenResult();
        console.log("[Auth Debug] Token fetched successfully for", currentUser.uid);
        setIsAdmin(token.claims.admin === true);
      } catch (err) {
        console.error("[Auth Debug] Token fetch failed:", err);
        setIsAdmin(false);
      } finally {
        setAdminChecked(true);
      }
    });
    // onAuthStateChanged can hang indefinitely in some private/incognito
    // sessions where third-party storage for the authDomain iframe is
    // restricted - without this, `loading` never resolves and every gated
    // page (e.g. Campus) is stuck on "Loading..." forever. Treat a stuck
    // check as logged-out; if auth does resolve later, `user` still updates.
    const fallback = setTimeout(() => {
      console.log("[Auth Debug] onAuthStateChanged fallback timeout (6s) triggered");
      setAdminChecked(true);
      setLoading(false);
    }, 6000);
    return () => { unsubscribeAuth(); clearTimeout(fallback); };
  }, []);

  // Live subscription to the user's own profile doc, so likes/comments/follows/
  // etc. from OTHER users update this account's stats everywhere in the app
  // (profile, navbar, dashboard) without a manual refresh.
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    let unsubscribeDoc = () => {};
    // Standard cancelled-flag effect-cleanup pattern (see e.g.
    // campus-app.jsx's CampusWorkspace phase-determination effect) - without
    // it, a quick logout+login in the same tab could leave this async IIFE's
    // getDoc/backfill for the PREVIOUS user still in flight when its own
    // cleanup runs (unsubscribeDoc is still the no-op placeholder at that
    // point - the real onSnapshot call hasn't happened yet), so the
    // cancelled effect's onSnapshot would attach anyway once the awaits
    // resolved, orphaned outside React's cleanup system, and keep calling
    // setUserData with the OLD user's data - silently clobbering the
    // NEW user's already-loaded profile for the rest of the session.
    let cancelled = false;

    (async () => {
      try {
        const docSnap = await getDoc(docRef);
        if (cancelled) return;

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Backfill fields missing on older accounts
          const patch = {};
          if (!data.uid) patch.uid = user.uid;
          if (!data.displayNameLower && data.displayName) patch.displayNameLower = data.displayName.toLowerCase();
          if (data.pulsePostsCount        === undefined) patch.pulsePostsCount        = 0;
          if (data.totalLikesReceived     === undefined) patch.totalLikesReceived     = 0;
          if (data.totalCommentsReceived  === undefined) patch.totalCommentsReceived  = 0;
          if (data.totalSavesReceived     === undefined) patch.totalSavesReceived     = 0;
          if (data.totalSharesReceived    === undefined) patch.totalSharesReceived    = 0;
          if (data.profileViews           === undefined) patch.profileViews           = 0;
          // Migrate email off the publicly-readable profile doc onto a
          // owner/admin-only doc - older accounts had it written here
          // directly, exposing it to every visitor of a public Dev Card.
          if (data.email) {
            patch.email = deleteField();
            setDoc(doc(db, "users_private", user.uid), { email: data.email }, { merge: true }).catch(() => {});
          }
          if (Object.keys(patch).length > 0) updateDoc(docRef, patch).catch(() => {});
        } else {
          // First login - create profile. `email` is intentionally NOT
          // written here - users/{uid} is publicly readable ("profiles are
          // sharable"), so email lives in users_private/{uid} instead
          // (owner/admin read-only, see firestore.rules).
          setDoc(doc(db, "users_private", user.uid), { email: user.email }, { merge: true }).catch(() => {});
          const newProfile = {
            uid:               user.uid,
            displayName:       user.displayName || "",
            displayNameLower:  (user.displayName || "").toLowerCase(),
            photoURL:          user.photoURL    || "",
            handle:            makeHandle(user),
            bio:            "",
            location:       "",
            github:         "",
            linkedin:       "",
            twitter:        "",
            website:        "",
            xp:             0,
            credits:        0,
            score:          0,
            ships:          0,
            arenaWins:      0,
            streak:         0,
            skills:         [],
            projects:       [],
            followersCount: 0,
            followingCount: 0,
            pulsePostsCount:       0,
            totalLikesReceived:    0,
            totalCommentsReceived: 0,
            totalSavesReceived:    0,
            totalSharesReceived:   0,
            // Portfolio - see lib/portfolio-sections.js for the section keys
            // sectionOrder/hiddenSections reference.
            headline:       "",
            currentRole:    "",
            availability:   "",
            contactEmail:   "",
            resumeUrl:      "",
            coverImage:     "",
            profileViews:   0,
            experience:     [],
            education:      [],
            certifications: [],
            achievements:   [],
            theme:          { accent: "#00FF41" },
            sectionOrder:   [],
            hiddenSections: [],
            joinedAt:       serverTimestamp(),
            lastActiveAt:   serverTimestamp(),
          };
          await setDoc(docRef, newProfile);
        }
        if (cancelled) return;

        unsubscribeDoc = onSnapshot(docRef, snap => {
          if (cancelled) return;
          if (snap.exists()) {
            const data = snap.data();
            setUserData({ ...data, uid: user.uid, tier: getTier(data.xp) });
          }
          setLoading(false);
        }, err => {
          if (cancelled) return;
          console.error("AuthContext: profile listener error", err);
          setLoading(false);
        });
      } catch (err) {
        if (cancelled) return;
        console.error("AuthContext: Firestore error", err);
        setUserData(null);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; unsubscribeDoc(); };
  }, [user]);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  // Kept for callers that want an immediate, guaranteed-fresh read right
  // after their own write - the live listener above will also pick it up,
  // this just skips waiting on listener latency.
  const refreshProfile = async () => {
    if (!user) return;
    const docRef  = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setUserData({ ...data, tier: getTier(data.xp) });
    }
  };

  const updateProfile = async (updates) => {
    if (!user) return;
    const docRef  = doc(db, "users", user.uid);
    const payload = { ...updates, lastActiveAt: serverTimestamp() };
    if (updates.displayName !== undefined) {
      payload.displayNameLower = updates.displayName.toLowerCase();
    }
    await updateDoc(docRef, payload);
    setUserData(prev => ({ ...prev, ...updates }));
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, isAdmin, adminChecked, logout, refreshProfile, updateProfile, getTier }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
