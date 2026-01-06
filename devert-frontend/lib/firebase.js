// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// REPLACE WITH YOUR ACTUAL CONFIG FROM FIREBASE CONSOLE
const firebaseConfig = {
  apiKey: "AIzaSyCpSlhp9RAlmdZLuun3DoVr0w9cFtJOzrk",
  authDomain: "devert-4a52b.firebaseapp.com",
  projectId: "devert-4a52b",
  storageBucket: "devert-4a52b.firebasestorage.app",
  messagingSenderId: "443471864308",
  appId: "1:443471864308:web:a8cd3419bb3997ed0399a1",
  measurementId: "G-08XD0LD2KL"
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
