function userProfilePage() {
  return {
    user: null,
    loading: true,

    init() {
      const authFns = window.authFns;

      if (!authFns || typeof authFns.initUser !== "function") {
        console.error("❌ authFns.initUser tidak ditemukan");
        return;
      }

      authFns.initUser(async (user) => {
        if (!user || user.isAnonymous) {
          alert("⛔ Halaman ini hanya untuk pengguna yang sudah login.");
          window.location.href = "/";
          return;
        }

        this.user = user;

        try {
          const res = await fetch(`https://wondertales.mvstream.workers.dev/user-profile?uid=${user.uid}`);
          
          if (!res.ok) {
            throw new Error(`HTTP ${res.status}`);
          }

          const data = await res.json();
          const fields = data.fields || {};

          this.user.tier = fields.tier?.stringValue || "—";
          this.user.premiumUntil = fields.premiumUntil?.timestampValue
            ? new Date(fields.premiumUntil.timestampValue)
            : null;

        } catch (err) {
          console.warn("❌ Gagal memuat data pengguna dari Firestore:", err.message || err);
          this.user.tier = "—";
          this.user.premiumUntil = null;
        }

        this.loading = false;
      });
    },

    loginGoogle() {
      window.authFns.loginGoogle().then(({ user }) => {
        this.user = user;
        this.init(); // Refresh profil
      });
    },

    async logout() {
      await window.authFns.logout();
      this.user = null;
      window.location.href = "/";
    }
  };
}

window.userProfilePage = userProfilePage;
