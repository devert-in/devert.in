import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import {
  initializeFirestore, collection, query, where, orderBy, limit, getDocs, doc, getDoc,
  onSnapshot, addDoc, setDoc, serverTimestamp, writeBatch, documentId, getCountFromServer,
} from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Re-exported so every caller - including devert-campus, a SEPARATE npm
// install/node_modules from this app - gets the exact same physical copy of
// the Firestore/Auth/Storage SDK that `db`/`auth`/`storage` below were built
// with. devert-campus has its own "firebase" dependency (drifted to a
// different version, 12.18.0 vs this app's 12.7.0), and a file that lives
// natively there importing straight from "firebase/firestore" gets ITS OWN
// bundled copy of doc()/collection() etc. - whose internal `instanceof
// CollectionReference/DocumentReference` check then fails against a `db`
// built by THIS package instance, even though both are nominally "firebase
// 12.x". Symptom: an uncaught "Expected first argument to doc() to be a
// CollectionReference, a DocumentReference or FirebaseFirestore" the moment
// a devert-campus-native file calls doc(db, ...)/collection(db, ...) -
// happens only for a signed-in user, since the earlier signed-out gate
// screens only ever touch lib/institutions.js (already devert-frontend-
// resident, so already safe). A Turbopack `resolveAlias` pointing
// devert-campus's "firebase/*" imports at this app's node_modules copy would
// fix this more structurally, but Turbopack on Windows currently rejects
// that (absolute Windows paths aren't supported, and the workaround of a
// forward-slash path instead hits "the chunking context does not support
// external modules" for client bundles) - re-exporting the functions
// themselves sidesteps both.
export {
  collection, query, where, orderBy, limit, getDocs, doc, getDoc, onSnapshot,
  addDoc, setDoc, serverTimestamp, writeBatch, documentId, getCountFromServer,
  storageRef, uploadBytes, getDownloadURL,
  signInWithEmailAndPassword, sendPasswordResetEmail, signOut,
};

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
