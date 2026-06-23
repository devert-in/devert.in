"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

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
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const docRef  = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({ ...data, tier: getTier(data.xp) });
          } else {
            // First login — create profile
            const newProfile = {
              uid:         currentUser.uid,
              email:       currentUser.email,
              displayName: currentUser.displayName || "",
              photoURL:    currentUser.photoURL    || "",
              handle:      makeHandle(currentUser),
              bio:         "",
              xp:          0,
              credits:     0,
              ships:       0,
              arenaWins:   0,
              streak:      0,
              skills:      [],
              joinedAt:    serverTimestamp(),
              lastActiveAt: serverTimestamp(),
            };
            await setDoc(docRef, newProfile);
            setUserData({ ...newProfile, tier: getTier(0) });
          }
        } catch (err) {
          console.error("AuthContext: Firestore error", err);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserData(null);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const docRef  = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      setUserData({ ...data, tier: getTier(data.xp) });
    }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout, refreshProfile, getTier }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
