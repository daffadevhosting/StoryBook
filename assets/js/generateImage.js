export async function generateIllustration(prompt) {
  try {
    const res = await fetch("https://lyra-backend-proxy.d-adityadwiputraramadhan.workers.dev/generate-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await res.json();

    if (data.output_url) {
      return data.output_url;
    } else {
      console.warn("Gagal generate gambar dari DeepAI:", data);
      return null;
    }
  } catch (err) {
    console.error("❌ DeepAI error:", err);
    return null;
  }
}
