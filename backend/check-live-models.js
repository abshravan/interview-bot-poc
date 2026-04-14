#!/usr/bin/env node
/**
 * Lists all Gemini models that support bidiGenerateContent (Live API).
 * Run from the backend directory:  node check-live-models.js
 */
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY is not set in backend/.env');
  process.exit(1);
}

fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`)
  .then((r) => r.json())
  .then((data) => {
    if (data.error) {
      console.error('API error:', data.error.message);
      process.exit(1);
    }
    const live = (data.models || []).filter((m) =>
      (m.supportedGenerationMethods || []).includes('bidiGenerateContent')
    );
    if (!live.length) {
      console.log('No models support bidiGenerateContent on this API key.');
      console.log('Live API access may need to be enabled for your project.');
      return;
    }
    console.log('Models supporting Live API (bidiGenerateContent):\n');
    live.forEach((m) => {
      const name = m.name.replace('models/', '');
      console.log(`  GEMINI_LIVE_MODEL=${name}`);
    });
    console.log('\nCopy one of the above into backend/.env and restart the backend.');
  })
  .catch((e) => console.error('Request failed:', e.message));
