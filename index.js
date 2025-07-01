export default {
  async fetch(request, env) {
    // Handle CORS preflight request (OPTIONS)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Allow CORS for POST requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    try {
      // Check if the request is POST
      if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
          status: 405,
          headers: corsHeaders,
        });
      }

      // Parse request body
      const { prompt } = await request.json();
      if (!prompt) {
        return new Response(JSON.stringify({ error: 'Prompt is required!' }), {
          status: 400,
          headers: corsHeaders,
        });
      }

      // OpenRouter API Key
      const OPENAI_API_KEY = env.OPENAI_API_KEY;
      const MODEL_NAME = 'mistralai/mistral-small-3.2-24b-instruct:free';

      // Payload untuk OpenRouter
      const payload = {
        model: MODEL_NAME,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      };

      // cabeza para la solicitud
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'HTTP-Referer': 'https://androidbutut.github.io',
        'X-Title': 'nDang AI companion',
      };

      // OpenRouter API
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();
      const modelResponse = data.choices[0].message.content.trim();

      // Enviar la respuesta con headers de CORS
      return new Response(JSON.stringify({ reply: modelResponse }), {
        headers: corsHeaders,
      });

    } catch (error) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  },
};