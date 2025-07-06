// Cloudflare Worker: Kombinasi Generate Cerita + Midtrans + Firestore

const FIREBASE_PROJECT_ID = 'ai-wondertales';
const FIREBASE_CLIENT_EMAIL = 'firebase-adminsdk-fbsvc@ai-wondertales.iam.gserviceaccount.com';

const paketConfig = {
  supporter: { price: 9000, quota: 3, days: 1 },
  subscriber: { price: 19000, quota: 10, days: 7 },
  premium: { price: 49000, quota: 9999, days: 30 },
  keluarga: { price: 99000, quota: 9999, days: 30, isFamily: true },
};

function withCORS(res) {
  const headers = new Headers(res.headers || {});
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers
  });
}

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: FIREBASE_CLIENT_EMAIL,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };

  const base64url = (obj) =>
    btoa(JSON.stringify(obj)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

  const encoder = new TextEncoder();
  const unsigned = `${base64url(header)}.${base64url(payload)}`;

  // 🔁 Ambil dari env DI SINI, bukan di luar
  const keyData = `-----BEGIN PRIVATE KEY-----\n${env.FIREBASE_PRIVATE_KEY}\n-----END PRIVATE KEY-----\n`.replace(/\\n/g, '\n');

  const key = await crypto.subtle.importKey(
    "pkcs8",
    encoder.encode(keyData),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(unsigned));
  const signed = `${unsigned}.${btoa(String.fromCharCode(...new Uint8Array(signature)))}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: signed
    })
  });

  const data = await res.json();
  return data.access_token;
}

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === 'POST' && url.pathname === '/create-transaction') {
      const body = await request.json();
      const { uid, paket } = body;
      if (!paketConfig[paket]) return withCORS(new Response('Invalid paket', { status: 400 }));

      const { price } = paketConfig[paket];
      if (!paketConfig[paket]) {
        return withCORS(new Response('Invalid paket', { status: 400 }));
      }
      const orderId = `order-${uid}-${Date.now()}`;

      const snapRequest = {
        transaction_details: {
          order_id: orderId,
          gross_amount: price
        },
        customer_details: {
          first_name: uid,
          email: `${uid}@wondertales.oi`
        }
      };

      const authHeader = 'Basic ' + btoa(env.MIDTRANS_SERVER_KEY + ':');
      const midtransRes = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(snapRequest)
      });
    
      const data = await midtransRes.json();
    
      if (!midtransRes.ok || !data.token) {
        console.warn("❌ Midtrans response:", data);
        return withCORS(Response.json({ error: "Gagal mendapatkan token dari Midtrans", detail: data }, { status: 500 }));
      }
    
      console.log("✅ Snap Token:", data.token);
      return withCORS(Response.json({ snapToken: data.token }));
    }

    if (request.method === 'POST' && url.pathname === '/midtrans-webhook') {
      const payload = await request.json();
      const { order_id, transaction_status, signature_key, gross_amount } = payload;
      const expectedSig = await crypto.subtle.digest('SHA-512',
        new TextEncoder().encode(order_id + gross_amount + env.MIDTRANS_SERVER_KEY));
      const hex = [...new Uint8Array(expectedSig)].map(b => b.toString(16).padStart(2, '0')).join('');
      if (hex !== signature_key) return withCORS(new Response('Invalid signature', { status: 403 }));

      const uid = order_id.split('-')[1];
      const paket = Object.entries(paketConfig).find(([_, val]) => val.price == gross_amount)?.[0];
      if (!paket) return withCORS(new Response('Unknown paket', { status: 400 }));

      const accessToken = await getAccessToken();
      const expireAt = new Date(Date.now() + paketConfig[paket].days * 86400000);

        const patchRes = await fetch(`https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=isPremium&updateMask.fieldPaths=tier&updateMask.fieldPaths=quotaPerDay&updateMask.fieldPaths=premiumUntil`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            fields: {
              isPremium: { booleanValue: true },
              tier: { stringValue: paket },
              quotaPerDay: { integerValue: paketConfig[paket].quota },
              premiumUntil: { timestampValue: expireAt.toISOString() }
            }
          })
        });

      const result = await patchRes.json();
      return withCORS(Response.json({ success: true, result }));
    }
    
    if (request.method === 'POST' && url.pathname === '/simpan-cerita-anon') {
      try {
        const body = await request.json();
        const { uid, tema, cerita, created_at } = body;
    
        if (!uid || !cerita) {
          return new Response(JSON.stringify({ error: 'Data tidak lengkap' }), {
            status: 400,
            headers: corsHeaders
          });
        }
    
        // Simpan ke KV Storage (Cloudflare KV harus dibuat dulu dan di-bind ke env.CERITA_ANON)
        await env.CERITA_ANON.put(`cerita-${uid}`, JSON.stringify({ uid, tema, cerita, created_at }));
    
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: corsHeaders
        });
    
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    if (request.method === 'GET' && url.pathname === '/cerita-anon') {
      const uid = url.searchParams.get('uid');
    
      // ✅ Jika UID diberikan → ambil satu cerita
      if (uid) {
        const data = await env.CERITA_ANON.get(`cerita-${uid}`);
        if (!data) {
          return new Response(JSON.stringify({ error: 'Cerita tidak ditemukan' }), {
            status: 404,
            headers: corsHeaders
          });
        }
    
        return new Response(data, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    
      // ✅ Kalau tidak ada UID → ambil semua cerita
      const list = await env.CERITA_ANON.list({ prefix: 'cerita-' });
      const ceritaPromises = list.keys.map(async ({ name }) => {
        const data = await env.CERITA_ANON.get(name);
        return JSON.parse(data);
      });
    
      const ceritaSemua = await Promise.all(ceritaPromises);
    
      return new Response(JSON.stringify(ceritaSemua), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Default: Generate Cerita AI
    if (request.method === 'POST') {
      try {
        const { prompt } = await request.json();
        if (!prompt) throw new Error("Prompt missing.");

        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: "llama3-8b-8192",
            messages: [
              { role: "system", content: "Kamu adalah penulis cerita anak. Ceritamu harus positif, imajinatif, dan mudah dimengerti anak usia 6-10 tahun." },
              { role: "user", content: prompt }
            ]
          })
        });

        const data = await groqRes.json();
        const reply = data.choices?.[0]?.message?.content?.trim() || 'No reply';

        return new Response(JSON.stringify({ reply }), {
          headers: { ...corsHeaders, 'Cache-Control': 'no-store' }
        });

      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: corsHeaders
        });
      }
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};