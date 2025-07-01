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

  if (!user) {
    if (loginBtn) loginBtn.style.display = "block";
    if (userStatus) userStatus.innerHTML = "<em>Belum login</em>";
    localStorage.removeItem("lyra_user_tier");
    localStorage.removeItem("lyra_logged_in");
    return;
  }

  const { uid, displayName, email, photoURL } = user;
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      displayName,
      email,
      photoURL,
      createdAt: new Date().toISOString(),
      isPremium: false,
      storyCountToday: 0,
      lastStoryDate: "",
      tier: "gratis"
    });
  }

  // Ambil data dari userRef yang udah pasti ada
  const finalSnap = await getDoc(userRef);
  const data = finalSnap.data();
  const tier = data.isPremium ? "Premium" : (data.tier || "Gratisan");

  // Update UI
  if (loginBtn) loginBtn.style.display = "none";
  if (userStatus) userStatus.innerHTML = `
    <img src="${photoURL}" class="rounded-circle me-2" width="32" />
    ${displayName} | <span class="text-sm">${tier}</span>
  `;

  // Simpan ke localStorage
  localStorage.setItem("lyra_user_tier", data.tier || "gratis");
  localStorage.setItem("lyra_logged_in", "true");
});
