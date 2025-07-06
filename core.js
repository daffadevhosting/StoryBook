// ✅ homepage.core.js — Untuk index.html
import { speak } from './utils/voice-widget.js';

window.addEventListener("DOMContentLoaded", () => {
  speak("Halo! Selamat datang di Lyra Storybook. Silakan klik mic untuk mulai.");
  console.log("✅ Homepage script loaded");
});


// ✅ app.core.js — Untuk story.html
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { buildWelcomeMessage } from './lyraWelcome.js';
import { getUser } from './firestoreClient.js';

function initApp() {
  const chatBox = document.getElementById("chat-box");
  if (!chatBox) return console.warn("❌ #chat-box tidak ditemukan");

  // TODO: restore chat, load localStorage, dsb
  console.log("✅ Story page ready");
}

if (location.pathname.includes("story")) {
  window.addEventListener("DOMContentLoaded", initApp);
}


// ✅ checkout.core.js — Untuk checkout.html
import { auth } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

window.addEventListener("DOMContentLoaded", () => {
  const snapBtn = document.querySelector("button[data-paket]");
  if (!snapBtn) return;

  onAuthStateChanged(auth, (user) => {
    if (!user) return alert("Silakan login dulu ya!");
    console.log("✅ User ready untuk checkout:", user.uid);
    // TODO: connect to Midtrans API endpoint
  });
});


// ✅ admin.core.js — Untuk admin.html
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

window.addEventListener("DOMContentLoaded", async () => {
  const table = document.querySelector("#admin-user-table");
  if (!table) return;

  const querySnapshot = await getDocs(collection(db, "users"));
  querySnapshot.forEach((doc) => {
    console.log("👤", doc.id, doc.data());
    // TODO: render ke tabel
  });

  console.log("✅ Admin panel loaded");
});


// ✅ firebase-config.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'YOUR_KEY',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };


// ✅ firestoreClient.js
import { db } from './firebase-config.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

export async function getUser(uid) {
  try {
    const ref = doc(db, "users", uid);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error("Gagal ambil user:", e);
    return null;
  }
}


// ✅ lyraWelcome.js
import { getUser } from './firestoreClient.js';

export async function buildWelcomeMessage(uid) {
  const user = await getUser(uid);
  const name = user?.name || "Penjelajah";

  return `Halo ${name}! 🌟\nSiap mulai cerita baru hari ini?`;
}


// ✅ utils/voice-widget.js
export function speak(text) {
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'id-ID';
  utter.rate = 1;
  window.speechSynthesis.speak(utter);
}

export function initMicWidget(callback) {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.lang = "id-ID";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = (e) => {
    const result = e.results[0][0].transcript;
    callback(result);
  };

  recognition.onerror = () => {
    speak("Maaf, Lyra tidak bisa mendengar. Coba lagi ya.");
  };

  document.getElementById("lyra-mic")?.addEventListener("click", () => {
    recognition.start();
    speak("Silakan bicara...");
  });
}

