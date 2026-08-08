import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

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

// Local Functions emulator, for developing callables (Razorpay order/verify,
// the proctor frame readers) without deploying.
//
// Double-gated on purpose. The env flag makes it explicit opt-in, so a developer
// running `npm run dev` without an emulator still talks to the real functions
// rather than failing on a dead port. The hostname check is the belt-and-braces
// half: even if the flag leaked into a production build, a page served from
// devert.in would refuse to point itself at 127.0.0.1.
//
// Enable with NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR=1 in devert-frontend/.env.local
// and `npx firebase-tools emulators:start --only functions`.
if (
  typeof window !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR === "1" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  console.info("[firebase] callables routed to the local Functions emulator on :5001");
}
