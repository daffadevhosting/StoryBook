// app.js

import { checkStoryLimit } from './limitCheck.js';
import { addBubble, sanitizeMarkdown, splitToParagraphs, removeLastBubble } from './utils.js';
import { lanjutkanCerita } from './continueStory.js';

const chatBox = document.getElementById("chatBox");
const storyForm = document.getElementById("storyForm");
const formSection = document.getElementById("storyFormWrapper");
const storySection = document.getElementById("storyBoxWrapper");
const submitBtn = storyForm.querySelector("button[type='submit']");

function showPanel(from, to) {
  from.classList.remove("panel-visible");
  from.classList.add("panel-hidden-left");
  to.classList.remove("panel-hidden-right");
  to.classList.add("panel-visible");
}

function formatCountdown(ms) {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h} jam ${m} menit ${s} detik`;
}

function disableFormWithCountdown(expiredAt) {
  const inputs = storyForm.querySelectorAll("input, select, button");
  inputs.forEach(el => el.disabled = true);

  const interval = setInterval(() => {
    const now = Date.now();
    const remaining = expiredAt - now;

    if (remaining <= 0) {
      clearInterval(interval);
      inputs.forEach(el => el.disabled = false);
      submitBtn.textContent = "Buat Cerita";
      localStorage.removeItem("lyra_story_expired");
      localStorage.removeItem("lyra_storyline_count");
    } else {
      submitBtn.textContent = `⏳ Tunggu ${formatCountdown(remaining)}...`;
    }
  }, 1000);
}

const expiredAt = parseInt(localStorage.getItem("lyra_story_expired") || "0");
if (Date.now() < expiredAt) {
  disableFormWithCountdown(expiredAt);
}

storyForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const nama = document.getElementById("nama").value.trim();
  const tempat = document.getElementById("tempat").value.trim();
  const petualangan = document.getElementById("petualangan").value.trim();
  const genre = document.getElementById("genre").value.trim().toLowerCase();

  if (!nama || !tempat || !petualangan || !genre) return;

  showPanel(formSection, storySection);
  chatBox.innerHTML = "";

  const recap = `
    <div class="story-recap">
      <p><strong>Ringkasan:</strong></p>
      <ul>
        <li>Nama: ${nama}</li>
        <li>Tempat tinggal: ${tempat}</li>
        <li>Petualangan: ${petualangan}</li>
        <li>Genre: ${genre}</li>
      </ul>
      <p>Siap! Mau lanjut buat ceritanya? 🎨</p>
      <button class="btn btn-success btn-sm me-2" id="confirm-yes">✅ Lanjutkan</button>
      <button class="btn btn-warning btn-sm" id="confirm-no">✏️ Edit Cerita</button>
    </div>
  `;
  addBubble(recap, "from-lyra story-setup");

  setTimeout(() => {
    document.getElementById("confirm-yes").onclick = async () => {
      removeLastBubble("story-setup");

      const loadingId = "lyra-loading";
      addBubble(`Tunggu sebentar, aku sedang menuliskan ceritanya... ✨ <div id="${loadingId}" class="spinner-border text-primary ms-2" role="status" style="width: 1.2rem; height: 1.2rem;"><span class="visually-hidden">Loading...</span></div>`, "from-lyra loading");

      const storyPrompt = `Buatkan cerita pendek anak berdasarkan informasi berikut:\n\nNama karakter: ${nama}\nTempat tinggal: ${tempat}\nPetualangan: ${petualangan}\nGenre: ${genre}\n\nCeritakan dalam gaya ${genre} yang imajinatif dan menyenangkan dalam 3 paragraf.`;

      try {
        const response = await fetch("https://lyra-backend-proxy.d-adityadwiputraramadhan.workers.dev/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mistralai/mistral-small-3.2-24b-instruct:free",
            messages: [
              { role: "system", content: "Kamu adalah penulis cerita anak-anak bernama Lyra yang imajinatif dan menyenangkan." },
              { role: "user", content: storyPrompt }
            ]
          })
        });

        const data = await response.json();
        const story = data.choices?.[0]?.message?.content || "Maaf, Lyra gagal menulis cerita kali ini.";

        removeLastBubble("loading");

        const paragraphs = splitToParagraphs(sanitizeMarkdown(story));
        addBubble(paragraphs, "from-lyra");

        const row = document.createElement("div");
        row.className = "d-flex gap-2 mt-3 story-continue";

        const continueBtn = document.createElement("button");
        continueBtn.className = "btn btn-outline-primary btn-sm";
        continueBtn.innerText = "🔁 Lanjutkan Cerita";
        continueBtn.onclick = () => lanjutkanCerita(paragraphs, genre);

        const editBtn = document.createElement("button");
        editBtn.className = "btn btn-outline-warning btn-sm";
        editBtn.innerText = "✏️ Edit Cerita";
        editBtn.onclick = () => {
          showPanel(storySection, formSection);
          checkStoryLimit();
        };

        row.appendChild(continueBtn);
        row.appendChild(editBtn);
        chatBox.appendChild(row);

      } catch (err) {
        removeLastBubble("loading");
        addBubble("Waduh... sepertinya Lyra ketiduran 😴. Coba lagi nanti ya!", "from-lyra");
        console.error(err);
      }
    };

    document.getElementById("confirm-no").onclick = () => {
      removeLastBubble("story-setup");
      chatBox.innerHTML = "";
      showPanel(storySection, formSection);
    };
  }, 500);
});

// ✅ Restore last saved story
window.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("lyra_last_story");
  if (saved) {
    chatBox.innerHTML = saved;
  }
});
