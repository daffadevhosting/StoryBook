---
layout: default
title: Buat Cerita
permalink: /buat-cerita123
---

<!-- ✅ Wrapper untuk transisi form dan story -->
<div class="relative overflow-hidden h-full">
  <div class="panel-wrapper relative w-full h-full">
    <div id="storyFormWrapper" class="absolute inset-0 panel-slide panel-visible">
      {% include formCerita.html %}
    </div>
    <div id="storyBoxWrapper" class="absolute inset-0 panel-slide panel-hidden-right">
      <div id="chatBox" class="bg-white p-6 rounded-xl shadow overflow-auto h-full"></div>
    </div>
  </div>
</div>

<!-- ✅ Modal Tailwind-style with GSAP animation only -->
<div id="storyModal" class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 hidden">
  <div id="storyModalContent" class="bg-white w-full max-w-4xl rounded-xl shadow-xl overflow-hidden">
    <div class="flex items-center justify-between px-6 py-4 border-b">
      <h3 class="text-lg font-semibold">📖 Cerita Lyra</h3>
      <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">✕</button>
    </div>
    <div class="modal-body p-6 overflow-auto prose max-h-[80vh]"></div>
  </div>
</div>

<script>
  function openModal() {
    const modal = document.getElementById("storyModal");
    const content = document.getElementById("storyModalContent");
    modal.classList.remove("hidden");
    gsap.fromTo(content, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.4, ease: "power2.out" });
  }

  function closeModal() {
    const modal = document.getElementById("storyModal");
    const content = document.getElementById("storyModalContent");
    gsap.to(content, {
      opacity: 0,
      scale: 0.9,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => modal.classList.add("hidden"),
    });
  }

  // ✅ Simpan & muat ulang cerita dari localStorage
  const chatBox = document.getElementById("chatBox");
  window.addEventListener("DOMContentLoaded", () => {
    const saved = localStorage.getItem("lyra_last_story");
    if (saved) {
      chatBox.innerHTML = saved;
      const storyFormWrapper = document.getElementById("storyFormWrapper");
      const storyBoxWrapper = document.getElementById("storyBoxWrapper");
      storyFormWrapper.classList.remove("panel-visible");
      storyFormWrapper.classList.add("panel-hidden-left");
      storyBoxWrapper.classList.remove("panel-hidden-right");
      storyBoxWrapper.classList.add("panel-visible");
    }
  });

  // Fungsi simpan story ke localStorage
  function simpanCeritaKeLokal() {
    localStorage.setItem("lyra_last_story", chatBox.innerHTML);
  }
</script>
