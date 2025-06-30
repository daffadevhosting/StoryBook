// utils.js

export function addBubble(text, className) {
  const div = document.createElement("div");
  div.className = `chat-bubble ${className}`;
  div.innerHTML = text;
  document.getElementById("chatBox").appendChild(div);
  document.getElementById("chatBox").scrollTop = document.getElementById("chatBox").scrollHeight;
}

export function removeLastBubble(className) {
  const bubbles = document.querySelectorAll(`.chat-bubble.${className}`);
  if (bubbles.length > 0) {
    bubbles[bubbles.length - 1].remove();
  }
}

export function sanitizeMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/~~(.*?)~~/g, '$1')
    .replace(/^#+\s*(.*)/gm, '$1')
    .replace(/^-\s+/gm, '')
    .replace(/\n/g, '<br>');
}

export function splitToParagraphs(text) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  let paragraphs = [];
  let temp = [];

  for (let i = 0; i < sentences.length; i++) {
    temp.push(sentences[i]);
    if (temp.length >= 3 || sentences[i].includes("Tapi") || sentences[i].startsWith("Dua hari kemudian")) {
      paragraphs.push(temp.join(" "));
      temp = [];
    }
  }
  if (temp.length > 0) paragraphs.push(temp.join(" "));

  return paragraphs.map(p => `<p>${p}</p>`).join("\n\n");
}
