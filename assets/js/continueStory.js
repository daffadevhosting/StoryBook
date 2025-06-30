// continueStory.js

import { addBubble, sanitizeMarkdown, splitToParagraphs, removeLastBubble } from './utils.js';

let lanjutanCount = parseInt(localStorage.getItem("lyra_storyline_count") || "0");
const isPremium = false; // 🔐 Ubah ke true kalau user premium

// Cek apakah user non-premium sudah melewati batas waktu akses
const expiredAt = parseInt(localStorage.getItem("lyra_story_expired") || "0");
const now = Date.now();

if (!isPremium && now > expiredAt) {
  localStorage.removeItem("lyra_storyline_count");
  lanjutanCount = 0;
  localStorage.removeItem("lyra_story_expired");
}

export async function lanjutkanCerita(previousText, genre = "fiksi") {
  if (!isPremium && lanjutanCount >= 2) {
    if (!localStorage.getItem("lyra_story_expired")) {
      const expireNext = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("lyra_story_expired", expireNext);
    }
    addBubble("😥 Maaf, story line kamu habis. Silakan tingkatkan tier untuk akses cerita tanpa batas. Kamu bisa lanjut lagi besok.", "from-lyra");
    return;
  }

  const lastPart = previousText
    .split('</p>')
    .slice(-2)
    .join(' ')
    .replace(/<[^>]+>/g, '')
    .trim();

  removeLastBubble('story-continue');

  const loadingId = "lyra-loading-continue";
  addBubble(`Tunggu sebentar, Lyra sedang menulis lanjutannya... ✍️ <div id="${loadingId}" class="spinner-border text-primary ms-2" role="status" style="width: 1rem; height: 1rem;"><span class="visually-hidden">Loading...</span></div>`, "from-lyra loading");

  const prompt = `Lanjutkan cerita ini. Jangan ubah nama karakter utama.

Genre: ${genre}

Cerita sebelumnya:
"${lastPart}"

Lanjutkan dengan 1-2 paragraf yang imajinatif dan menyenangkan. Buat pembaca penasaran dengan akhir paragraf terakhir.`;

  try {
    const response = await fetch("https://lyra-backend-proxy.d-adityadwiputraramadhan.workers.dev/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1:free",
        messages: [
          {
            role: "system",
            content: "Tugas kamu adalah melanjutkan cerita anak-anak berdasarkan kelanjutan cerita terakhir. Jangan mengubah nama karakter utama. Buat pembaca penasaran di akhir."
          },
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();
    const story = data.choices?.[0]?.message?.content || "Gagal menulis lanjutan 😔";

    removeLastBubble("loading");

    const paragraphs = splitToParagraphs(sanitizeMarkdown(story));

    const modalBody = document.querySelector("#storyModal .modal-body");
    if (modalBody) {
      modalBody.innerHTML = paragraphs;
      const modal = new bootstrap.Modal(document.getElementById("storyModal"));
      modal.show();
    } else {
      addBubble(paragraphs, "from-lyra");
    }

    if (!isPremium) {
      lanjutanCount++;
      localStorage.setItem("lyra_storyline_count", lanjutanCount);
    }

    if (isPremium) {
      const continueBtn = document.createElement("button");
      continueBtn.className = "btn btn-outline-primary btn-sm mt-3 story-continue";
      continueBtn.innerText = "🔁 Lanjutkan Cerita Ini";
      continueBtn.onclick = () => lanjutkanCerita(paragraphs, genre);
      document.getElementById("chatBox").appendChild(continueBtn);
    }

  } catch (err) {
    removeLastBubble("loading");
    addBubble("Waduh... gagal melanjutkan cerita 😢", "from-lyra");
    console.error(err);
  }
}
