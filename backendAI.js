export default {
  async fetch(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: cors,
      });
    }

    try {
      const body = await request.json();
      const prompt = body?.prompt;

      if (!prompt || typeof prompt !== 'string') {
        return new Response(JSON.stringify({ error: 'Prompt is required' }), {
          status: 400,
          headers: cors,
        });
      }

      const apiKey = env.GEMINI_API_KEY;
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

      const aiRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        }),
      });

      if (!aiRes.ok) {
        return new Response(JSON.stringify({ error: `AI Error (${aiRes.status})` }), {
          status: 502,
          headers: cors,
        });
      }

      const data = await aiRes.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response from AI.';

      return new Response(JSON.stringify({ reply }), {
        headers: {
          ...cors,
          'Cache-Control': 'no-store',
        },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message || 'Unexpected error' }), {
        status: 500,
        headers: cors,
      });
    }
  },
};
