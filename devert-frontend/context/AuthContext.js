"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

const STAFF_ROLES = ["faculty", "tpo", "admin"];
const BOOTSTRAP_ADMIN_EMAIL = "admin@devert.in";

/**
 * Ensures users/{uid} exists (merge-safe — never clobbers existing fields
 * like role, rollNumber, xp, credits set elsewhere). Called once per sign-in.
 */
async function ensureUserDoc(user) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
        await setDoc(
            ref,
            {
                displayName: user.displayName || "",
                email: user.email || "",
                photoURL: user.photoURL || "",
                role: "student",
                xp: 0,
                credits: 0,
                createdAt: serverTimestamp(),
            },
            { merge: true }
        );
        const created = await getDoc(ref);
        return created.exists() ? created.data() : null;
    }
    return snap.data();
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null); // Extended Firestore data
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                try {
                    const data = await ensureUserDoc(currentUser);
                    setUserData({
                        xp: 0,
                        credits: 0,
                        role: "student",
                        ...data,
                    });
                } catch (err) {
                    console.error("Error fetching user data:", err);
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

    const refreshProfile = useCallback(async () => {
        if (!auth.currentUser) return;
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            setUserData({ xp: 0, credits: 0, role: "student", ...docSnap.data() });
        }
    }, []);

    const role = userData?.role || "student";
    const isStaff = STAFF_ROLES.includes(role) || user?.email === BOOTSTRAP_ADMIN_EMAIL;
    const isAdmin = role === "admin" || user?.email === BOOTSTRAP_ADMIN_EMAIL;
    const isOnboarded = !!userData?.prepOnboarded;

    return (
        <AuthContext.Provider
            value={{
                user,
                userData,
                loading,
                logout,
                refreshProfile,
                // Placements Prep additions — kept additive so existing pages
                // consuming { user, userData, loading, logout } are unaffected.
                role,
                profile: userData,
                isStaff,
                isAdmin,
                isOnboarded,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
