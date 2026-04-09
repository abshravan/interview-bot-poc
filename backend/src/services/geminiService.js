/**
 * Gemini Live — WebSocket relay service
 *
 * The browser opens a WebSocket to /ws/interview?sessionId=<id>.
 * This service:
 *   1. Accepts raw PCM audio chunks from the browser
 *   2. Forwards them to Gemini Live (BidiGenerateContent)
 *   3. Streams Gemini's audio response back to the browser
 *   4. Persists text turns to the Session transcript via the sessions route
 *
 * Gemini Live API endpoint (v1alpha):
 *   wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent
 */

const WebSocket = require('ws');
const Session = require('../models/Session');
const Resume = require('../models/Resume');

const GEMINI_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

function buildSystemPrompt(role, resumeText) {
  return `You are a professional interviewer conducting a real-time voice interview.

Role being interviewed for: ${role}

Candidate's resume:
${resumeText}

Rules:
- Ask one question at a time
- Wait for the candidate's answer before continuing
- Ask relevant follow-up questions based on responses
- Keep the conversation natural and professional
- Be slightly challenging but respectful
- Start by briefly introducing yourself and asking the first question`;
}

/**
 * Attach Gemini Live relay logic to a client WebSocket connection.
 * @param {WebSocket} clientWs  - the browser-side WebSocket
 * @param {string}    sessionId - MongoDB session _id
 */
async function handleInterviewSocket(clientWs, sessionId) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // Dev mode: echo mock messages so the UI still works without a real key
    console.warn('GEMINI_API_KEY not set — running in mock interview mode');
    return handleMockInterview(clientWs, sessionId);
  }

  // Load session + resume
  let session;
  try {
    session = await Session.findById(sessionId).populate('resumeId');
    if (!session) {
      clientWs.close(1008, 'Session not found');
      return;
    }
  } catch (err) {
    clientWs.close(1011, 'DB error');
    return;
  }

  const systemPrompt = buildSystemPrompt(session.role, session.resumeId.text);

  // Open connection to Gemini Live
  const geminiWs = new WebSocket(`${GEMINI_WS_URL}?key=${apiKey}`);
  let setupComplete = false;
  const audioQueue  = [];   // buffer audio until setup is ACK'd

  geminiWs.on('open', () => {
    // Gemini Live BidiGenerateContent WebSocket uses camelCase JSON field names
    const setup = {
      setup: {
        model: 'models/gemini-2.0-flash-live-001',
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Charon' },
            },
          },
        },
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
      },
    };
    geminiWs.send(JSON.stringify(setup));
    console.log('[gemini] Setup message sent, waiting for setupComplete…');
  });

  // Gemini → browser
  geminiWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Wait for Gemini's setup ACK before forwarding audio
      if (msg.setupComplete !== undefined) {
        setupComplete = true;
        console.log('[gemini] Setup complete — flushing', audioQueue.length, 'queued chunks');
        while (audioQueue.length && geminiWs.readyState === WebSocket.OPEN) {
          geminiWs.send(audioQueue.shift());
        }
        return;
      }

      // Forward audio chunks directly to browser
      if (msg.serverContent?.modelTurn?.parts) {
        for (const part of msg.serverContent.modelTurn.parts) {
          if (part.inlineData && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: 'audio', data: part.inlineData.data }));
          }
          if (part.text) {
            await appendTranscript(sessionId, 'interviewer', part.text);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'text', role: 'interviewer', content: part.text }));
            }
          }
        }
      }

      // Turn complete signal
      if (msg.serverContent?.turnComplete && clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'turnComplete' }));
      }
    } catch (e) {
      console.error('[gemini] Error processing Gemini message:', e.message);
    }
  });

  // Browser → Gemini
  clientWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'audio') {
        // camelCase: realtimeInput / mediaChunks / mimeType
        const payload = JSON.stringify({
          realtimeInput: {
            mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: msg.data }],
          },
        });
        if (!setupComplete) {
          audioQueue.push(payload);   // queue until Gemini is ready
        } else if (geminiWs.readyState === WebSocket.OPEN) {
          geminiWs.send(payload);
        }
      }

      if (msg.type === 'text') {
        await appendTranscript(sessionId, 'candidate', msg.content);
        // camelCase: clientContent / turnComplete
        const payload = JSON.stringify({
          clientContent: {
            turns: [{ role: 'user', parts: [{ text: msg.content }] }],
            turnComplete: true,
          },
        });
        if (geminiWs.readyState === WebSocket.OPEN) {
          geminiWs.send(payload);
        }
      }

      if (msg.type === 'end') {
        geminiWs.close();
      }
    } catch (e) {
      console.error('[gemini] Error processing client message:', e.message);
    }
  });

  clientWs.on('close', () => geminiWs.close());

  // Track whether we already fell back so we don't double-invoke mock mode
  let fellBack = false;
  function fallbackToMock(reason) {
    if (fellBack) return;
    fellBack = true;
    console.warn(`[gemini] Falling back to mock mode — reason: ${reason}`);
    if (clientWs.readyState === WebSocket.OPEN) {
      // Notify the browser so the user knows why, then start mock interview
      clientWs.send(JSON.stringify({
        type: 'text',
        role: 'interviewer',
        content: `[Demo mode — Gemini API unavailable: ${reason}] Starting mock interview.`,
      }));
      handleMockInterview(clientWs, sessionId);
    }
  }

  geminiWs.on('close', (code, reasonBuf) => {
    const reason = reasonBuf?.toString() || '(no reason)';
    console.log(`[gemini] WS closed — code: ${code}  reason: ${reason}`);
    if (!setupComplete) {
      // Closed before we ever got setupComplete — Gemini rejected the connection
      fallbackToMock(`WS closed ${code}: ${reason}`);
    } else if (!fellBack && clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
  });

  geminiWs.on('error', (err) => {
    console.error('[gemini] WS error:', err.message);
    fallbackToMock(err.message);
  });
}

async function appendTranscript(sessionId, role, content) {
  try {
    await Session.findByIdAndUpdate(sessionId, {
      $push: { transcript: { role, content } },
    });
  } catch (e) {
    console.error('Failed to append transcript:', e.message);
  }
}

// ---------------------------------------------------------------------------
// Mock interview handler (no API key)
// ---------------------------------------------------------------------------
const MOCK_QUESTIONS = [
  "Hello! I'm your interviewer today. Let's start — can you briefly introduce yourself and walk me through your background?",
  "Great! Can you describe a challenging technical problem you've solved recently?",
  "How do you approach debugging a complex issue in production?",
  "Tell me about a time you worked with a team under pressure. How did you handle it?",
  "Do you have any questions for me before we wrap up?",
];

// How long mock waits before auto-advancing to the next question (ms)
const MOCK_QUESTION_WINDOW = 12000;

function handleMockInterview(clientWs, sessionId) {
  let questionIndex = 0;
  let autoTimer     = null;   // auto-advance timer per question

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
    // Auto-advance after the window so the interview doesn't stall when user speaks
    autoTimer = setTimeout(sendNext, MOCK_QUESTION_WINDOW);
  };

  setTimeout(sendNext, 1000);

  clientWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      // Text input: advance immediately after a short pause
      if (msg.type === 'text' && msg.content) {
        await appendTranscript(sessionId, 'candidate', msg.content);
        if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
        setTimeout(sendNext, 1500);
      }

      // Audio input is streamed continuously — do NOT reset timer on every chunk
      // (ScriptProcessor fires every ~256 ms even during silence).
      // The fixed MOCK_QUESTION_WINDOW above handles the listening gap.

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
