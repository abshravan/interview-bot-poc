/**
 * Gemini Live — interview relay service
 *
 * Uses the @google/genai SDK (Gemini 2.0) for the Live API.
 * Falls back to mock mode if the API key is missing or the connection fails.
 */

const { GoogleGenAI } = require('@google/genai');
const Session = require('../models/Session');

function buildSystemPrompt(role, resumeText) {
  return `You are a professional interviewer conducting a real-time voice interview.

Role being interviewed for: ${role}

Candidate's resume:
${resumeText}

Rules:
- Ask ONE question at a time, then STOP and wait for the candidate's answer
- Do NOT ask another question until the candidate has finished speaking
- Ask relevant follow-up questions based on their responses
- Keep the conversation natural and professional
- Be slightly challenging but respectful
- Start by briefly introducing yourself and asking the first question
- After 4-5 questions, wrap up the interview politely`;
}

/**
 * Attach Gemini Live relay logic to a client WebSocket connection.
 * @param {import('ws').WebSocket} clientWs
 * @param {string} sessionId
 */
async function handleInterviewSocket(clientWs, sessionId) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[gemini] GEMINI_API_KEY not set — running in mock interview mode');
    return handleMockInterview(clientWs, sessionId);
  }

  // Load session + resume from DB
  let dbSession;
  try {
    dbSession = await Session.findById(sessionId).populate('resumeId');
    if (!dbSession) { clientWs.close(1008, 'Session not found'); return; }
  } catch (err) {
    console.error('[gemini] DB error:', err.message);
    clientWs.close(1011, 'DB error');
    return;
  }

  const systemPrompt = buildSystemPrompt(dbSession.role, dbSession.resumeId.text);
  const ai = new GoogleGenAI({ apiKey });

  // ── Fallback helper ─────────────────────────────────────────────────────────
  let fellBack = false;
  function fallbackToMock(reason) {
    if (fellBack) return;
    fellBack = true;
    console.warn(`[gemini] Falling back to mock mode — ${reason}`);
    if (clientWs.readyState === 1 /* OPEN */) {
      clientWs.send(JSON.stringify({
        type: 'text',
        role: 'interviewer',
        content: `[Running in demo mode — ${reason}]`,
      }));
      handleMockInterview(clientWs, sessionId);
    }
  }

  // ── Connect to Gemini Live ───────────────────────────────────────────────────
  let liveSession;
  try {
    liveSession = await ai.live.connect({
      model: 'gemini-2.0-flash-live-001',
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Charon' },
          },
        },
        systemInstruction: systemPrompt,
      },
      callbacks: {
        onopen() {
          console.log('[gemini] Live session connected ✓');
        },

        onmessage(msg) {
          try {
            if (msg.serverContent?.modelTurn?.parts) {
              for (const part of msg.serverContent.modelTurn.parts) {
                if (part.inlineData && clientWs.readyState === 1) {
                  clientWs.send(JSON.stringify({
                    type: 'audio',
                    data: part.inlineData.data,
                  }));
                }
                if (part.text) {
                  appendTranscript(sessionId, 'interviewer', part.text);
                  if (clientWs.readyState === 1) {
                    clientWs.send(JSON.stringify({
                      type: 'text',
                      role: 'interviewer',
                      content: part.text,
                    }));
                  }
                }
              }
            }
            if (msg.serverContent?.turnComplete && clientWs.readyState === 1) {
              clientWs.send(JSON.stringify({ type: 'turnComplete' }));
            }
          } catch (e) {
            console.error('[gemini] Error handling message:', e.message);
          }
        },

        onerror(err) {
          const msg = err?.message || String(err);
          console.error('[gemini] Live session error:', msg);
          fallbackToMock(msg);
        },

        onclose(event) {
          const reason = event?.reason || '(no reason)';
          console.log(`[gemini] Live session closed — code: ${event?.code}  reason: ${reason}`);
          if (!fellBack && clientWs.readyState === 1) {
            clientWs.close();
          }
        },
      },
    });
  } catch (err) {
    console.error('[gemini] Failed to connect to Live API:', err.message);
    fallbackToMock(err.message);
    return;
  }

  // ── Browser → Gemini ────────────────────────────────────────────────────────
  clientWs.on('message', async (data) => {
    if (fellBack) return;   // already in mock mode
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'audio') {
        liveSession.sendRealtimeInput({
          audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' },
        });
      }

      if (msg.type === 'text') {
        await appendTranscript(sessionId, 'candidate', msg.content);
        liveSession.send({
          turns: [{ role: 'user', parts: [{ text: msg.content }] }],
          turnComplete: true,
        });
      }

      if (msg.type === 'end') {
        try { liveSession.close(); } catch {}
      }
    } catch (e) {
      console.error('[gemini] Error processing client message:', e.message);
    }
  });

  clientWs.on('close', () => {
    if (!fellBack && liveSession) {
      try { liveSession.close(); } catch {}
    }
  });
}

// ── Transcript helper ──────────────────────────────────────────────────────────
async function appendTranscript(sessionId, role, content) {
  try {
    await Session.findByIdAndUpdate(sessionId, {
      $push: { transcript: { role, content } },
    });
  } catch (e) {
    console.error('[gemini] Failed to append transcript:', e.message);
  }
}

// ── Mock interview (no API key / fallback) ─────────────────────────────────────
const MOCK_QUESTIONS = [
  "Hello! I'm your AI interviewer today. Let's start — can you briefly introduce yourself and walk me through your background?",
  "Great! Can you describe a challenging technical problem you've solved recently and how you approached it?",
  "How do you approach debugging a complex issue in production?",
  "Tell me about a time you worked with a team under pressure. How did you handle it?",
  "Do you have any questions for me before we wrap up?",
];

const MOCK_QUESTION_WINDOW = 12000;  // ms to wait before auto-advancing

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
    // Auto-advance after window so interview never stalls
    autoTimer = setTimeout(sendNext, MOCK_QUESTION_WINDOW);
  };

  setTimeout(sendNext, 1000);

  clientWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'text' && msg.content) {
        await appendTranscript(sessionId, 'candidate', msg.content);
        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        setTimeout(sendNext, 1500);
      }
      if (msg.type === 'end') {
        if (autoTimer) clearTimeout(autoTimer);
        clientWs.close();
      }
      // Audio chunks are ignored in mock mode; the auto-timer handles pacing
    } catch (e) {
      console.error('[mock] WS error:', e.message);
    }
  });
}

module.exports = { handleInterviewSocket };
