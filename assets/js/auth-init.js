import { auth, db, onAuthStateChanged, provider, signInWithPopup } from './firebase-config.js';
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

onAuthStateChanged(auth, async (user) => {
  const loginBtn = document.getElementById("loginBtn");
  const userStatus = document.getElementById("userStatus");

  if (user) {
    const { uid, displayName, email, photoURL } = user;
    const docRef = doc(db, "users", uid);
    let userSnap = await getDoc(docRef);

    // 🔐 Buat akun baru jika belum ada
    if (!userSnap.exists()) {
      await setDoc(docRef, {
        displayName,
        email,
        photoURL,
        createdAt: new Date().toISOString(),
        isPremium: false,
        storyCountToday: 0,
        lastStoryDate: ""
      });
      userSnap = await getDoc(docRef); // 🔁 Ambil ulang setelah dibuat
    }

    // 🔑 Ambil status tier
    const data = userSnap.data();
    const tier = data.isPremium ? "Premium" : "Gratisan";

    localStorage.setItem("lyra_user_tier", tier);
    localStorage.setItem("lyra_logged_in", "true");

    // UI update
    if (loginBtn) loginBtn.style.display = "none";
    if (userStatus) userStatus.innerHTML = `<img src="${photoURL}" class="rounded-full w-6 inline me-2" /> ${displayName} | ${tier}`;
  } else {
    // Belum login
    if (loginBtn) loginBtn.style.display = "block";
    if (userStatus) userStatus.innerHTML = "<em>Belum login</em>";
    localStorage.removeItem("lyra_user_tier");
    localStorage.setItem("lyra_logged_in", "false");
  }
});
