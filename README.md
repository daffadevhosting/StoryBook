# 📘 L Y Я A - AI StoryBook Editor

**Proyek ini adalah editor buku cerita interaktif yang menggunakan AI untuk menghasilkan cerita berdasarkan tema dan gaya pilihan pengguna.** Dibuat menggunakan HTML+JS dan terintegrasi dengan model AI gratis `deepseek-r1` via OpenRouter API.

---

## 🎯 Tujuan Proyek

* Memberikan platform ringan dan gratis untuk membuat buku cerita.
* Memanfaatkan AI open-source sebagai storyteller yang fleksibel.
* Mendukung berbagai gaya cerita: anak-anak, dewasa, horor, komedi, dll.
* Siap untuk dikembangkan ke arah storytelling interaktif, PDF export, dan ilustrasi AI.

---

## 🛣️ Roadmap

### ✅ Versi 1.0 (MVP)

* [x] Input tema dan judul cerita
* [x] Dropdown pilihan gaya cerita
* [x] Integrasi dengan `deepseek-r1:free` dari OpenRouter
* [x] Render hasil cerita per paragraf sebagai halaman
* [x] Ilustrasi dummy per halaman (via `placekitten`)

### 🔜 Versi 1.1

* [ ] Upload gambar ilustrasi manual (dari PlaygroundAI)
* [ ] Export cerita ke PDF
* [ ] Simpan ke localStorage / Firestore (jika online)

### 🚀 Versi 2.x

* [ ] Audio TTS untuk membacakan cerita
* [ ] Editor gaya Markdown untuk tiap halaman
* [ ] Mode baca fullscreen (story reading mode)
* [ ] Bookmark & daftar cerita tersimpan

---

## 🧰 Teknologi

* HTML5 + Bootstrap 5
* JavaScript vanilla
* OpenRouter API (DeepSeek R1)
* Compatible dengan Jekyll static hosting

---

## 🧪 Cara Jalankan (Local / Jekyll)

1. Copy isi file `index.html` ke proyek Jekyll kamu (misalnya ke `_pages/story.html`)
2. Pastikan koneksi internet aktif (untuk akses ke API OpenRouter)
3. Ubah API Key di script jika perlu
4. Buka halaman dan coba buat cerita!

---

## 🔑 API Key

Gunakan OpenRouter API Key kamu:

* Daftar gratis di [https://openrouter.ai](https://openrouter.ai)
* Dapatkan key dari halaman `/keys`
* Jangan hardcode key di publik, simpan di config/ENV jika deploy

---

## 🤝 Kontribusi

Project ini open-source dan bebas dimodifikasi.

* Tambah fitur baru? Pull request welcome!
* Punya ide cerita menarik? Open issue!

---

## 📄 Lisensi

MIT License © 2025 nDang

> Powered by DeepSeek R1, dibangun dengan semangat rakyat ngoding mandiri. 🚀

