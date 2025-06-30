// generateImage.js

const replicateAPI = "https://lyra-backend-proxy.d-adityadwiputraramadhan.workers.dev/image";

export async function generateImage(prompt) {
  try {
    const response = await fetch(replicateAPI, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: "0fbacf7afc6c144e5be9767cff80f25aff23e52b0708f17e20f9879b2f21516c",
        input: {
          prompt: `${prompt}, digital illustration, watercolor, dreamy, children book style`,
          width: 512,
          height: 512,
          scheduler: "DPMSolverMultistep",
          num_outputs: 1
        }
      })
    });

    const data = await response.json();

    const predictionId = data.id;
    if (!predictionId) throw new Error("Gagal ambil ID prediksi");

    // Polling hasil gambar
    let outputUrl = null;
    for (let i = 0; i < 20; i++) {
      await new Promise(r => setTimeout(r, 2000)); // delay 2 detik
      const checkRes = await fetch(`${replicateAPI}/${predictionId}`);
      const checkData = await checkRes.json();
      if (checkData.status === "succeeded") {
        outputUrl = checkData.output?.[0];
        break;
      }
      if (checkData.status === "failed") throw new Error("Gagal generate gambar");
    }

    return outputUrl;
  } catch (err) {
    console.error("generateImage error:", err);
    return null;
  }
}
