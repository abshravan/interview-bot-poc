const { GoogleGenerativeAI } = require('@google/generative-ai');

function formatTranscript(transcript) {
  return transcript
    .map((m) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
    .join('\n');
}

async function generateFeedback(transcript, role) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `You are evaluating a mock job interview for the role: "${role}".

Below is the interview transcript:
---
${formatTranscript(transcript)}
---

Analyse the transcript and respond ONLY with a valid JSON object (no markdown, no extra text) in this exact shape:
{
  "strengths": ["<string>", ...],
  "weaknesses": ["<string>", ...],
  "communicationScore": <integer 1-10>,
  "technicalScore": <integer 1-10>,
  "suggestions": ["<string>", ...]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
  return JSON.parse(clean);
}

module.exports = { generateFeedback };
