// _includes/auth-init.js

import { auth, db, onAuthStateChanged, provider, signInWithPopup  } from './firebase-config.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js';


document.getElementById("loginBtn")?.addEventListener("click", async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("Login berhasil:", result.user.displayName);
  } catch (err) {
    console.error("Login gagal:", err);
    alert("Gagal login. Coba lagi nanti.");
  }
});

// 🔐 Dengarkan perubahan status login
onAuthStateChanged(auth, async (user) => {
  const loginBtn = document.getElementById("loginBtn");
  const userStatus = document.getElementById("userStatus");

  if (user) {
    const { uid, displayName, email, photoURL } = user;

    // Cek apakah user udah ada di Firestore
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Buat user baru
      await setDoc(userRef, {
        displayName,
        email,
        photoURL,
        createdAt: new Date().toISOString(),
        isPremium: false,
        storyCountToday: 0,
        lastStoryDate: ""
      });
    }

    // Update UI
    if (loginBtn) loginBtn.style.display = "none";
    if (userStatus) userStatus.innerHTML = `<img src="${photoURL}" class="rounded-circle me-2" width="32" /> ${displayName}`;

  } else {
    // Belum login
    if (loginBtn) loginBtn.style.display = "block";
    if (userStatus) userStatus.innerHTML = "<em>Belum login</em>";
  }
});
