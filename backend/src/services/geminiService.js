/**
 * Gemini interview service — text-based with Gemini Flash chat API.
 *
 * The browser sends transcribed speech as text messages over WebSocket.
 * This service maintains a chat session with Gemini and sends text responses
 * back to the frontend, which speaks them using the browser SpeechSynthesis API.
 *
 * Falls back to scripted mock questions when no API key is set.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const Session = require('../models/Session');

const GEMINI_MODEL = 'gemini-1.5-flash';
const MAX_QUESTIONS = 6;   // end interview after this many AI turns

function buildSystemPrompt(role, resumeText) {
  return `You are a professional interviewer conducting a real-time voice interview. Your responses will be spoken aloud, so keep them concise and conversational.

Role being interviewed for: ${role}

Candidate's resume:
${resumeText}

Strict rules:
- Ask EXACTLY ONE question per response, then stop and wait
- Keep responses to 2-3 sentences maximum (voice context)
- Do NOT list multiple questions or bullet points
- React naturally to the candidate's answers before asking the next question
- After ${MAX_QUESTIONS} questions, end with: "That concludes our interview today. Thank you for your time — you'll receive feedback shortly."
- Start by greeting the candidate and asking your first question`;
}

/**
 * @param {import('ws').WebSocket} clientWs
 * @param {string} sessionId
 */
async function handleInterviewSocket(clientWs, sessionId) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[interview] No API key — running mock mode');
    return handleMockInterview(clientWs, sessionId);
  }

  // Load session + resume
  let dbSession;
  try {
    dbSession = await Session.findById(sessionId).populate('resumeId');
    if (!dbSession) { clientWs.close(1008, 'Session not found'); return; }
  } catch (err) {
    console.error('[interview] DB error:', err.message);
    clientWs.close(1011, 'DB error');
    return;
  }

  const genAI   = new GoogleGenerativeAI(apiKey);
  const model   = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: buildSystemPrompt(dbSession.role, dbSession.resumeId.text),
  });
  const chat         = model.startChat({ history: [] });
  let   turnCount    = 0;
  let   fellBack     = false;
  let   interviewEnded = false;

  function fallbackToMock(reason) {
    if (fellBack) return;
    fellBack = true;
    console.warn(`[interview] Falling back to mock — ${reason}`);
    if (clientWs.readyState === 1) {
      clientWs.send(JSON.stringify({
        type: 'text', role: 'interviewer',
        content: `[Demo mode — ${reason}] Starting mock interview.`,
      }));
      handleMockInterview(clientWs, sessionId);
    }
  }

  async function sendAIResponse(userMessage) {
    try {
      const result = await chat.sendMessage(userMessage);
      const text   = result.response.text().trim();
      turnCount++;

      await appendTranscript(sessionId, 'interviewer', text);
      if (clientWs.readyState === 1) {
        clientWs.send(JSON.stringify({ type: 'text', role: 'interviewer', content: text }));
        clientWs.send(JSON.stringify({ type: 'turnComplete' }));
      }

      // Check if interview should end
      const endPhrases = ['concludes our interview', 'thank you for your time', 'feedback shortly'];
      const shouldEnd  = turnCount >= MAX_QUESTIONS ||
                         endPhrases.some((p) => text.toLowerCase().includes(p));
      if (shouldEnd && !interviewEnded) {
        interviewEnded = true;
        setTimeout(() => {
          if (clientWs.readyState === 1) clientWs.send(JSON.stringify({ type: 'interviewEnd' }));
        }, 4000);
      }
    } catch (err) {
      console.error('[interview] Gemini error:', err.message);
      fallbackToMock(err.message);
    }
  }

  // Kick off with the opening question
  setTimeout(() => sendAIResponse('Begin the interview now.'), 500);

  clientWs.on('message', async (data) => {
    if (fellBack || interviewEnded) return;
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'text' && msg.content?.trim()) {
        await appendTranscript(sessionId, 'candidate', msg.content);
        await sendAIResponse(msg.content);
      }
      if (msg.type === 'end') {
        interviewEnded = true;
        clientWs.close();
      }
    } catch (e) {
      console.error('[interview] Error processing message:', e.message);
    }
  });

  clientWs.on('close', () => { /* nothing to clean up */ });
}

// ── Transcript helper ──────────────────────────────────────────────────────────
async function appendTranscript(sessionId, role, content) {
  try {
    await Session.findByIdAndUpdate(sessionId, {
      $push: { transcript: { role, content } },
    });
  } catch (e) {
    console.error('[interview] Failed to append transcript:', e.message);
  }
}

// ── Mock interview (no API key / fallback) ─────────────────────────────────────
const MOCK_QUESTIONS = [
  "Hello! I'm your AI interviewer. Let's get started — can you briefly introduce yourself and walk me through your background?",
  "Great! Can you describe a challenging technical problem you've solved recently and how you approached it?",
  "How do you approach debugging a complex issue in a production system?",
  "Tell me about a time you worked with a team under pressure. How did you handle it?",
  "What aspects of this role excite you the most, and how does it align with your career goals?",
  "That concludes our interview today. Thank you for your time — you'll receive feedback shortly.",
];

const MOCK_QUESTION_WINDOW = 12000;

function handleMockInterview(clientWs, sessionId) {
  let questionIndex = 0;
  let autoTimer     = null;

  const sendNext = () => {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    if (questionIndex >= MOCK_QUESTIONS.length) {
      clientWs.send(JSON.stringify({ type: 'interviewEnd' }));
      return;
    }
    const content = MOCK_QUESTIONS[questionIndex++];
    appendTranscript(sessionId, 'interviewer', content);
    clientWs.send(JSON.stringify({ type: 'text', role: 'interviewer', content }));
    clientWs.send(JSON.stringify({ type: 'turnComplete' }));
    autoTimer = setTimeout(sendNext, MOCK_QUESTION_WINDOW);
  };

  setTimeout(sendNext, 1000);

  clientWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'text' && msg.content?.trim()) {
        await appendTranscript(sessionId, 'candidate', msg.content);
        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        setTimeout(sendNext, 1500);
      }
      if (msg.type === 'end') {
        if (autoTimer) clearTimeout(autoTimer);
        clientWs.close();
      }
    } catch (e) {
      console.error('[mock] WS error:', e.message);
    }
  });
}

module.exports = { handleInterviewSocket };
