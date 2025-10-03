// netlify/functions/openrouter-proxy.js
exports.handler = async function(event, context) {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) return { statusCode: 500, body: 'Missing API key' };

  const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
  const OPENROUTER_MODEL = body.model || 'x-ai/grok-4-fast:free';

  const payload = {
    model: OPENROUTER_MODEL,
    messages: body.messages || []
  };

  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'QuickChat'
    },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  const contentType = res.headers.get('content-type') || 'application/json';

  return {
    statusCode: res.status,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*'
    },
    body: text
  };
};
