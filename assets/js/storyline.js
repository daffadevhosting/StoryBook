// ✅ LYRA STORYBOOK ENGINE - FINAL CLEAN VERSION
import { auth } from './firebase-config.js';
import { checkStoryLimit, incrementStoryCount } from './limitCheck.js';
/**
 * Menghapus elemen yang tidak diinginkan dari sesi yang dipulihkan.
 * @param {HTMLElement} parentElement Elemen induk tempat elemen akan dibersihkan.
 */
function cleanRestoredSession(parentElement) {
  const dirtyElements = parentElement.querySelectorAll("input, .story-recap, .story-setup, .story-continue");
  dirtyElements.forEach(el => {
    const bubble = el.closest(".chat-bubble");
    if (bubble) bubble.remove();
  });
}

// --- DOM Elements ---
const chatBox = document.getElementById("chatBox");
const storyFormWrapper = document.getElementById("storyFormWrapper");
const storyBoxWrapper = document.getElementById("storyBoxWrapper");
const storyModal = document.getElementById("savedStoryModal");
const storyModalBody = document.getElementById("savedStoryList");

// --- Application State ---
const appState = {
  step: 0,
  answers: [],
  isLoading: false,
  prompts: [
    "Halo! Siapa nama tokoh utama kita?",
    "Di mana dia tinggal?",
    "Apa petualangan atau masalah yang dia hadapi?",
    "Pilih genre: horor, fiksi, drama, atau kisah nyata."
  ],
  lastStoryContent: ""
};

// --- Utility Functions ---
function loadStoryFromList(id) {
  const storyList = JSON.parse(localStorage.getItem("lyra_story_list") || "[]");
  const story = storyList.find(s => s.id === id);

  if (!story) {
    alert("Cerita tidak ditemukan.");
    return;
  }

  const chatBox = document.getElementById("chatBox");
  if (!chatBox) {
    console.error("chatBox tidak ditemukan.");
    return;
  }

  // ⛳ Perbaikan di sini:
  const content = story.htmlContent || story.content;
  if (!content) {
    alert("Konten cerita kosong.");
    return;
  }

  chatBox.innerHTML = content;
  chatBox.scrollTop = chatBox.scrollHeight;

  // Sembunyikan form, tampilkan cerita
  document.getElementById("storyFormWrapper")?.classList.add("hidden");
  document.getElementById("storyBoxWrapper")?.classList.remove("hidden");

  // Tutup modal kalo ada
  const modal = document.getElementById("storyModal");
  if (modal) modal.classList.add("hidden");

  // Simpan ulang ke last_session
  localStorage.setItem("lyra_last_session", content);
}

function renderBubble(html, className = "from-lyra") {
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${className} my-2`;
  bubble.innerHTML = html;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function removeLastBubble(className) {
  const last = chatBox.querySelector(`.${className}:last-child`);
  if (last) last.remove();
}

function formatStory(text) {
  const safe = text.replace(/\*\*(.*?)\*\*/g, '$1')
                   .replace(/\*(.*?)\*/g, '$1')
                   .replace(/\n/g, '<br>');
  return `<div class="prose prose-sm max-w-none">${safe}</div>`;
}

function clearChat() {
  chatBox.innerHTML = "";
  appState.step = 0;
  appState.answers = [];
  appState.lastStoryContent = "";

  storyFormWrapper?.classList.remove("hidden");
  storyBoxWrapper?.classList.add("hidden");
}

function toggleSections(showForm) {
  const form = document.getElementById("storyFormWrapper");
  const box = document.getElementById("storyBoxWrapper");
  if (form && box) {
    form.classList.toggle("hidden", !showForm);
    box.classList.toggle("hidden", showForm);
  } else {
    console.warn("toggleSections gagal: Elemen tidak ditemukan.");
  }
}

// --- Chat Flow ---
function askQuestion() {
  if (appState.step >= appState.prompts.length) return showRecap();
  const prompt = appState.prompts[appState.step];
  const inputId = `input-step-${appState.step}`;
  const html = `<p>${prompt}</p><input id="${inputId}" type="text" class="mt-2 w-full p-2 border rounded-md focus:outline-none">`;
  renderBubble(html);
  const input = document.getElementById(inputId);
  if (input) {
    input.focus();
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && input.value.trim()) {
        appState.answers.push(input.value.trim());
        input.disabled = true;
        input.classList.add("opacity-60");
        appState.step++;
        setTimeout(askQuestion, 500);
      }
    });
  }
}

function showRecap() {
  const [nama, tempat, petualangan, genre] = appState.answers;
  const recap = `
    <div class="story-recap">
      <p><strong>Ringkasan Cerita:</strong></p>
      <ul class="list-disc pl-5">
        <li>Nama: ${nama}</li>
        <li>Tempat tinggal: ${tempat}</li>
        <li>Petualangan: ${petualangan}</li>
        <li>Genre: ${genre}</li>
      </ul>
      <p class="mt-3">Siap untuk membuat ceritanya? 🎨</p>
      <div class="flex gap-3 mt-2">
        <button id="confirm-yes" class="bg-purple-600 text-white px-4 py-2 rounded">✅ Lanjutkan</button>
        <button id="confirm-no" class="bg-yellow-400 text-white px-4 py-2 rounded">✏️ Ulangi</button>
      </div>
    </div>
  `;
  renderBubble(recap, "story-setup");
  setTimeout(() => {
    document.getElementById("confirm-yes").onclick = generateStory;
    document.getElementById("confirm-no").onclick = () => {
      clearChat();
      askQuestion();
    };
  }, 100);
}

async function generateStory() {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    alert("Kamu belum login!");
    return;
  }

  const { allowed, message } = await checkStoryLimit(uid);
  if (!allowed) {
    alert(message || "Kuota anda habis");
    return;
  }

  if (appState.isLoading) return;
  appState.isLoading = true;
  const [nama, tempat, petualangan, genre] = appState.answers;
  const storyPrompt = `Buatkan cerita pendek anak berdasarkan informasi berikut:\n\nNama karakter: ${nama}\nTempat tinggal: ${tempat}\nPetualangan: ${petualangan}\nGenre: ${genre}\n\nCeritakan dalam gaya ${genre} yang imajinatif dan menyenangkan dalam 3 paragraf.`;
  renderBubble(`Tunggu sebentar, Lyra sedang menulis ceritanya... <div class='spinner ml-2'></div>`, "loading");

  try {
    const res = await fetch("https://lyra-backend-proxy.d-adityadwiputraramadhan.workers.dev/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          { role: "system", content: "Kamu adalah penulis cerita anak-anak bernama Lyra yang imajinatif dan menyenangkan." },
          { role: "user", content: storyPrompt }
        ]
      })
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API Error - Status: ${res.status}`, errorText);
      removeLastBubble("loading");
      renderBubble("Gagal membuat cerita. Terjadi masalah di server.");
      return;
    }

    await incrementStoryCount(uid);

    const data = await res.json();
    const rawContent = data.choices?.[0]?.message?.content?.trim();

    if (!rawContent || rawContent.length < 20) {
      removeLastBubble("loading");
      renderBubble("Gagal membuat cerita. Respons tidak lengkap atau kosong.");
      return;
    }

    removeLastBubble("loading");
    renderBubble(formatStory(rawContent));
    appState.lastStoryContent = rawContent;
    renderStoryActions();
    saveStoryToLocalStorage(chatBox.innerHTML);
    toggleSections(false);

  } catch (err) {
    removeLastBubble("loading");
    renderBubble("Gagal membuat cerita. Koneksi terputus atau format data salah.");
    console.error("Fetch error:", err);
  } finally {
    appState.isLoading = false;
  }
}

function renderStoryActions() {
  const row = document.createElement("div");
  row.className = "flex gap-3 mt-4 story-continue";

  const cont = document.createElement("button");
  cont.innerText = "🔁 Lanjutkan Cerita";
  cont.className = "bg-purple-100 text-purple-700 px-3 py-1 rounded";
  cont.onclick = continueStory;

  const edit = document.createElement("button");
  edit.innerText = "✏️ Buat Cerita Baru";
  edit.className = "bg-yellow-100 text-yellow-800 px-3 py-1 rounded";
  edit.onclick = () => { clearChat(); askQuestion(); };

  const save = document.createElement("button");
  save.innerText = "💾 Simpan Cerita";
  save.className = "bg-green-100 text-green-800 px-3 py-1 rounded";
  save.onclick = () => {
    openSaveStoryModal();
  };

  const viewBtn = document.createElement("button");
  viewBtn.className = "px-4 py-2 text-sm rounded bg-cyan-100 text-cyan-800 hover:bg-cyan-200 transition";
  viewBtn.innerText = "📚 Lihat Cerita Saya";
  viewBtn.onclick = renderSavedStoriesList;

  row.appendChild(cont);
  row.appendChild(edit);
  row.appendChild(save);
  row.appendChild(viewBtn);
  chatBox.appendChild(row);
}

async function continueStory() {
  if (appState.isLoading) return;
  appState.isLoading = true;

  // 🛑 Cek login
  const user = auth.currentUser;
  if (!user) {
    alert("Silakan login untuk melanjutkan cerita.");
    appState.isLoading = false;
    return;
  }

  const uid = user.uid;
  const { allowed, message } = await checkStoryLimit(uid);

  if (!allowed) {
    console.warn("Limit cerita tercapai:", message);
    appState.isLoading = false;

    const modal = document.getElementById("premiumModal");
    if (modal) modal.classList.remove("hidden"); // ✅ TAMPILKAN MODAL PREMIUM
    return;
  }

  await incrementStoryCount(uid);
  
  if (appState.isLoading) return;
  appState.isLoading = true;
  removeLastBubble("story-continue");

  const last = appState.lastStoryContent;
  const [nama, tempat, petualangan, genre] = appState.answers;
  const prompt = `Lanjutkan cerita ini dengan 1 paragraf tambahan:

${last}

Cerita tentang ${nama} di ${tempat}, genre ${genre}, petualangan: ${petualangan}`;

  renderBubble("Sedang menulis kelanjutan ceritanya... <div class='spinner ml-2'></div>", "loading");

  try {
    const res = await fetch("https://lyra-backend-proxy.d-adityadwiputraramadhan.workers.dev/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-001",
        messages: [
          { role: "system", content: "Kamu adalah penulis cerita anak-anak bernama Lyra yang imajinatif dan menyenangkan." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim();
    removeLastBubble("loading");
    if (!text || text.length < 20) {
      renderBubble("Kelanjutan cerita gagal dibuat. Coba lagi nanti.");
    } else {
      renderBubble(formatStory(text));
      appState.lastStoryContent += `\n\n${text}`;
      renderStoryActions();
      saveStoryToLocalStorage(chatBox.innerHTML);
    }
  } catch (err) {
    removeLastBubble("loading");
    renderBubble("Terjadi error saat melanjutkan cerita.");
  } finally {
    appState.isLoading = false;
  }
}

function saveStoryToList(title = "Cerita Tanpa Judul") {
  const chatBox = document.getElementById("chatBox");
  if (!chatBox) return;
  const storyList = JSON.parse(localStorage.getItem("lyra_story_list") || "[]");

  storyList.push({
    id: `lyra-${Date.now()}`,
    title,
    htmlContent: chatBox.innerHTML,
    timestamp: Date.now()
  });

  localStorage.setItem("lyra_story_list", JSON.stringify(storyList));
  alert("✅ Cerita disimpan ke daftar!");
}

function saveStoryFromModal() {
  const title = document.getElementById("storyTitleInput").value.trim();
  if (!title) return alert("Judul tidak boleh kosong!");
  saveStoryToList(title);
  closeModal();
}

// ✅ Expose ke global
window.saveStoryToList = saveStoryToList;
window.saveStoryFromModal = saveStoryFromModal;
window.closeModal = closeModal;

function renderSavedStoriesList() {
  const storyList = JSON.parse(localStorage.getItem("lyra_story_list") || "[]");

  if (storyList.length === 0) {
    alert("Belum ada cerita yang disimpan.");
    return;
  }

  let html = `<div class="p-4 space-y-3">`;
  storyList.forEach(story => {
    const date = new Date(story.timestamp).toLocaleString("id-ID");
    html += `
      <div class="border p-3 rounded bg-white shadow">
        <div class="flex justify-between items-center">
          <div>
            <h3 class="font-semibold text-purple-700">${story.title}</h3>
            <p class="text-xs text-gray-500">${date}</p>
          </div>
          <button class="bg-blue-500 text-white px-3 py-1 text-sm rounded hover:bg-blue-600"
            onclick="loadStoryFromList('${story.id}')">
            📖 Buka
          </button>
        </div>
      </div>
    `;
  });
  html += `</div>`;

  document.querySelector("#storyModal .modal-body").innerHTML = html;
  showModal();
}

// --- Local Storage ---
function saveStoryToLocalStorage(html) {
  localStorage.setItem("lyra_last_session", html);
}

function loadStoryFromLocalStorage() {
  return localStorage.getItem("lyra_last_session");
}

function initApp() {
  const savedSession = loadStoryFromLocalStorage();
  if (savedSession) {
    chatBox.innerHTML = savedSession;
    cleanRestoredSession(chatBox);
    toggleSections(false);
    //storyFormWrapper.classList.add("hidden");

    const existingActionRow = chatBox.querySelector(".story-continue");
    if (existingActionRow) existingActionRow.remove();
    renderStoryActions();

    const allStoryParts = chatBox.querySelectorAll('.chat-bubble .prose');
    if (allStoryParts.length > 0) {
      appState.lastStoryContent = Array.from(allStoryParts).map(el => el.innerText).join('\n\n');
    }
  } else {
    clearChat();
    askQuestion(); // ✅ Hanya jalan kalau gak ada sesi
  }
}

// ✅ Menampilkan modal Tailwind
function showModal() {
  const modal = document.getElementById("storyModal");
    const content = document.getElementById("storyModalContent");
  if (modal) modal.classList.remove("hidden");
    gsap.fromTo(content, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" });
}

// ✅ Menyembunyikan modal
function closeModal() {
  document.getElementById("saveStoryModal")?.classList.add("hidden");
  document.getElementById("saveStoryModal").classList.add("hidden");
  const modal = document.getElementById("storyModal");
    const content = document.getElementById("storyModalContent");
  if (modal) modal.classList.add("hidden");
    gsap.to(content, {
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => modal.classList.add("hidden"),
    });
}

function openSaveStoryModal() {
  document.getElementById("saveStoryModal").classList.remove("hidden");
}

// ✅ Escape key handler (opsional)
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ✅ Tombol close modal
document.addEventListener("DOMContentLoaded", () => {
  const closeBtn = document.getElementById("closeModal");
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
});

window.loadStoryFromList = loadStoryFromList;
window.addEventListener("DOMContentLoaded", initApp);
