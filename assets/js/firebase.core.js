// --- firebase.core.js ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyC66-ToD2qDwer_E7BizYI6YWkBzgnrVfI",
  authDomain: "ai-wondertales.firebaseapp.com",
  projectId: "ai-wondertales",
  storageBucket: "ai-wondertales.firebasestorage.app",
  messagingSenderId: "233515475210",
  appId: "1:233515475210:web:9ac790788f5a83cc6c1af3"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

window.firebaseCore = {
  app,
  auth,
  db,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
};