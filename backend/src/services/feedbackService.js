const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Build the transcript string fed to Gemini for analysis.
 */
function formatTranscript(transcript) {
  return transcript
    .map((m) => `${m.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
    .join('\n');
}

/**
 * Use Gemini Flash to analyse the interview transcript and produce structured feedback.
 */
async function generateFeedback(transcript, role) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback mock when no key is configured (dev/demo mode)
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('GEMINI_API_KEY not set — returning mock feedback');
    return mockFeedback();
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

function mockFeedback() {
  return {
    strengths: ['Clear communication', 'Good problem-solving approach'],
    weaknesses: ['Could provide more concrete examples', 'Technical depth needs improvement'],
    communicationScore: 7,
    technicalScore: 6,
    suggestions: [
      'Use the STAR method when answering behavioural questions',
      'Review system design fundamentals',
      'Practice articulating trade-offs',
    ],
  };
}

module.exports = { generateFeedback };
