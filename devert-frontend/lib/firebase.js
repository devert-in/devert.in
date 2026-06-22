// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// REPLACE WITH YOUR ACTUAL CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyBrDM6gD4j1X0rj76UtTQfaiaayRemCmIc",
  authDomain: "devert-me.firebaseapp.com",
  projectId: "devert-me",
  storageBucket: "devert-me.firebasestorage.app",
  messagingSenderId: "550891323057",
  appId: "1:550891323057:web:6999302efca0825ccc2c90",
  measurementId: "G-RJ85KZJZT5"
};

// Initialize Firebase
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Initialize Firestore with settings to avoid timeout issues
import { initializeFirestore } from "firebase/firestore";
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});
