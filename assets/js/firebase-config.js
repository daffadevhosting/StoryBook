import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDYansCQvayBzEiDCrTzp0GWZVcsGHklw0",
  authDomain: "storybook-lyra.firebaseapp.com",
  projectId: "storybook-lyra",
  storageBucket: "storybook-lyra.firebasestorage.app",
  messagingSenderId: "976159841203",
  appId: "1:976159841203:web:fbb2574b427bb00f5f09c6",
  measurementId: "G-PHBBNYLEWN"
};

// 🔌 Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, db, provider, onAuthStateChanged, signInWithPopup };