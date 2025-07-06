// --- langganan.app.js ---
function langgananPage() {
  return {
    user: null,
    paketList: {
        supporter: { price: 9000, quota: 3, days: 1 },
        subscriber: { price: 19000, quota: 10, days: 7 },
        premium: { price: 49000, quota: 9999, days: 30 },
        keluarga: { price: 99000, quota: 9999, days: 30, isFamily: true },
    },
    init() {
    window.authFns.initUser((user) => {
        if (!user || user.isAnonymous) {
        alert("⛔ Anda harus login terlebih dahulu.");
        return;
        }

        this.user = user;
    });
    },
    loginGoogle() {
      window.authFns.loginGoogle().then((result) => {
        this.user = result.user;
      });
    },
    async langganan(tier) {
      if (!this.user) return alert("Silakan login terlebih dahulu.");
          if (!this.user) return alert("User tidak ditemukan. Silakan login.");
          const res = await fetch("https://wondertales.mvstream.workers.dev/create-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid: this.user.uid, paket: tier })
          });
          const data = await res.json();
console.log("Response Midtrans:", data);
          if (data.snapToken) {
            window.snap.pay(data.snapToken);
          } else {
            alert("Gagal membuat transaksi.");
          }
      console.log("Langganan dengan tier:", tier);
    }
  };
}

window.langgananPage = langgananPage;
