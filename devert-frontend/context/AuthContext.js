"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";

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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserData(null);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Live subscription to the user's own profile doc, so likes/comments/follows/
  // etc. from OTHER users update this account's stats everywhere in the app
  // (profile, navbar, dashboard) without a manual refresh.
  useEffect(() => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    let unsubscribeDoc = () => {};

    (async () => {
      try {
        const docSnap = await getDoc(docRef);

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
          if (Object.keys(patch).length > 0) updateDoc(docRef, patch).catch(() => {});
        } else {
          // First login - create profile
          const newProfile = {
            uid:               user.uid,
            email:             user.email,
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
            joinedAt:       serverTimestamp(),
            lastActiveAt:   serverTimestamp(),
          };
          await setDoc(docRef, newProfile);
        }

        unsubscribeDoc = onSnapshot(docRef, snap => {
          if (snap.exists()) {
            const data = snap.data();
            setUserData({ ...data, uid: user.uid, tier: getTier(data.xp) });
          }
          setLoading(false);
        }, err => {
          console.error("AuthContext: profile listener error", err);
          setLoading(false);
        });
      } catch (err) {
        console.error("AuthContext: Firestore error", err);
        setUserData(null);
        setLoading(false);
      }
    })();

    return () => unsubscribeDoc();
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
    <AuthContext.Provider value={{ user, userData, loading, logout, refreshProfile, updateProfile, getTier }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
