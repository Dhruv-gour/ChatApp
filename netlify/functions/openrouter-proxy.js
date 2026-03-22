// netlify/functions/openrouter-proxy.js
const https = require('https');

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

  const OPENROUTER_MODEL = body.model || 'meta-llama/llama-3.1-8b-instruct:free';
  const payload = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: body.messages || []
  });

  return new Promise((resolve) => {
    const req = https.request('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'QuickChat',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 200,
          headers: {
            'Content-Type': res.headers['content-type'] || 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          body: data
        });
      });
    });

    req.on('error', (e) => {
      resolve({
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ error: e.message })
      });
    });

    req.write(payload);
    req.end();
  });
};
