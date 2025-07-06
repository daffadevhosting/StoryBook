// --- auth.js ---

// ✅ Pastikan window.authFns selalu ada
window.authFns = window.authFns || {};

// Tambahkan fungsi loginGoogle
window.authFns.loginGoogle = () => {
  const { auth, GoogleAuthProvider, signInWithPopup } = window.firebaseCore;
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
};

// Tambahkan initUser
window.authFns.initUser = async (callback) => {
  const {
    auth,
    onAuthStateChanged,
    db,
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    signInAnonymously
  } = window.firebaseCore;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (!user.isAnonymous) {
        localStorage.setItem("uid", user.uid);
      }

      if (user.providerData[0]?.providerId === "google.com") {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            nama: user.displayName,
            email: user.email,
            tier: user.tier,
            bergabung: serverTimestamp()
          });
        }
      }

      callback?.(user);
    } else {
      await signInAnonymously(auth);
    }
  });
};

// Tambahkan logout
window.authFns.logout = async () => {
  await window.firebaseCore.signOut(window.firebaseCore.auth);
  localStorage.removeItem("uid");
};

// Tambahkan getCurrentUser
window.authFns.getCurrentUser = () => {
  return window.firebaseCore.auth?.currentUser || null;
};
