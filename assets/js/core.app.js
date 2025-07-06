// core.app.js

window.langgananPage = function () {
  return {
    user: null,
    paketList: {
      supporter: { nominal: 5000, durasi: 1 },
      subscriber: { nominal: 15000, durasi: 7 },
      premium: { nominal: 45000, durasi: 30 }
    },
    init() {
      const auth = window.firebaseApp.auth;
      const { onAuthStateChanged } = window.firebaseFns;
      onAuthStateChanged(auth, (u) => {
        this.user = u;
        console.log("Login sebagai:", u?.displayName, u?.uid);
      });
    },
    loginGoogle() {
      const auth = window.firebaseApp.auth;
      const { GoogleAuthProvider, signInWithPopup } = window.firebaseFns;
      const provider = new GoogleAuthProvider();
      signInWithPopup(auth, provider)
        .then((result) => {
          this.user = result.user;
        })
        .catch((error) => {
          alert("Login gagal: " + error.message);
        });
    },
    async langganan(tier) {
      if (!this.user) return alert("User tidak ditemukan. Silakan login.");
      const res = await fetch("https://wondertales.mvstream.workers.dev/create-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid: this.user.uid, paket: tier })
      });
      const data = await res.json();
      if (data.snapToken) {
        window.snap.pay(data.snapToken);
      } else {
        alert("Gagal membuat transaksi.");
      }
    }
  };
};
