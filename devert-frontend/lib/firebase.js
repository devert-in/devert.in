import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyBrDM6gD4j1X0rj76UtTQfaiaayRemCmIc",
  authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN || "devert-me.firebaseapp.com",
  projectId: "devert-me",
  storageBucket: "devert-me.firebasestorage.app",
  messagingSenderId: "550891323057",
  appId: "1:550891323057:web:6999302efca0825ccc2c90",
  measurementId: "G-RJ85KZJZT5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
export const storage = getStorage(app);
// Region must match the onCall declarations in functions/index.js - a mismatch
// fails at call time with an opaque "internal" error, not a routing error.
export const functions = getFunctions(app, "us-central1");
