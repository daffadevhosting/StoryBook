// ✅ LYRA STORYBOOK ENGINE - CLEAN VERSION **daffa**

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
  toggleSections(true);
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
          { role: "system", content: "Kamu adalah Lyra, penulis cerita anak-anak yang imajinatif dan menyenangkan." },
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
    const title = appState.answers[0] || "Cerita Tanpa Judul";
    saveToStoryList(title, chatBox.innerHTML);
    alert("Cerita disimpan ✅");
  };

  row.appendChild(cont);
  row.appendChild(edit);
  row.appendChild(save);
  chatBox.appendChild(row);
}

function continueStory() {
  renderBubble("(continueStory belum diimplementasi)");
}

// --- Local Storage ---
function saveStoryToLocalStorage(html) {
  localStorage.setItem("lyra_last_session", html);
}

function loadStoryFromLocalStorage() {
  return localStorage.getItem("lyra_last_session");
}

function initApp() {
  const saved = loadStoryFromLocalStorage();
  if (saved) {
    chatBox.innerHTML = saved;
    toggleSections(false);
    renderStoryActions();
    const proseEls = chatBox.querySelectorAll(".prose");
    if (proseEls.length) {
      appState.lastStoryContent = Array.from(proseEls).map(el => el.innerText).join("\n\n");
    }
  } else {
    clearChat();
    askQuestion();
  }
}

window.addEventListener("DOMContentLoaded", initApp);
