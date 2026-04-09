/**
 * Gemini Live — raw WebSocket relay for BidiGenerateContent.
 *
 * Modelled on the Python phase7 Gemini client:
 *   - model:  gemini-3.1-flash-live-preview  (override via GEMINI_LIVE_MODEL env var)
 *   - audio input:  realtimeInput.audio  (NOT realtimeInput.mediaChunks)
 *   - transcripts:  inputAudioTranscription / outputAudioTranscription in setup
 *   - VAD:          realtimeInputConfig.automaticActivityDetection
 *   - barge-in:     serverContent.interrupted
 */

const WebSocket = require('ws');
const Session   = require('../models/Session');

const GEMINI_WS_URL =
  'wss://generativelanguage.googleapis.com/ws/' +
  'google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

const DEFAULT_MODEL = 'gemini-3.1-flash-live-preview';

// ── Prompt ─────────────────────────────────────────────────────────────────────
function buildSystemPrompt(role, resumeText) {
  return `You are a professional interviewer conducting a real-time voice interview.

Role being interviewed for: ${role}

Candidate's resume:
${resumeText}

Rules:
- Ask ONE question at a time, then STOP and wait for the candidate's answer
- Do NOT ask another question until the candidate has finished speaking
- React naturally to answers before asking the next question
- Keep responses concise — this is a voice conversation
- Be professional but warm, slightly challenging but respectful
- Start by greeting the candidate briefly and asking your first question
- After 4–5 questions wrap up politely`;
}

// ── Setup payload (matches Python _build_setup) ────────────────────────────────
function buildSetupPayload(role, resumeText) {
  const rawModel = (process.env.GEMINI_LIVE_MODEL || DEFAULT_MODEL).trim();
  const modelId  = rawModel.startsWith('models/') ? rawModel : `models/${rawModel}`;

  return {
    setup: {
      model: modelId,
      generationConfig: {
        responseModalities: ['AUDIO'],
        temperature: 0.7,
      },
      systemInstruction: {
        parts: [{ text: buildSystemPrompt(role, resumeText) }],
      },
    },
  };
}

// ── Main handler ───────────────────────────────────────────────────────────────
async function handleInterviewSocket(clientWs, sessionId) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.warn('[gemini] No API key — mock interview mode');
    return handleMockInterview(clientWs, sessionId);
  }

  // Load session + resume
  let dbSession;
  try {
    dbSession = await Session.findById(sessionId).populate('resumeId');
    if (!dbSession) { clientWs.close(1008, 'Session not found'); return; }
  } catch (err) {
    console.error('[gemini] DB error:', err.message);
    clientWs.close(1011, 'DB error');
    return;
  }

  const setupPayload = buildSetupPayload(dbSession.role, dbSession.resumeId.text);
  const geminiWs     = new WebSocket(`${GEMINI_WS_URL}?key=${apiKey}`);

  let setupComplete = false;
  const audioQueue  = [];   // hold audio until setupComplete

  // Per-turn transcript accumulators (mirrors Python _GeminiTurnState)
  let inputTranscript  = '';
  let outputTranscript = '';

  let fellBack = false;
  function fallbackToMock(reason) {
    if (fellBack) return;
    fellBack = true;
    console.warn(`[gemini] Falling back to mock mode — ${reason}`);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({
        type: 'text', role: 'interviewer',
        content: `[Demo mode — ${reason}]`,
      }));
      handleMockInterview(clientWs, sessionId);
    }
  }

  // ── Gemini WS open → send setup ─────────────────────────────────────────────
  geminiWs.on('open', () => {
    const modelId = (process.env.GEMINI_LIVE_MODEL || DEFAULT_MODEL).trim();
    console.log(`[gemini] WS open — setup for model: ${modelId}`);
    geminiWs.send(JSON.stringify(setupPayload));
  });

  // ── Gemini → browser ────────────────────────────────────────────────────────
  geminiWs.on('message', async (raw) => {
    let msg;
    try { msg = JSON.parse(raw.toString()); }
    catch { return; }

    // 1. setupComplete ACK — flush queued audio
    if (msg.setupComplete !== undefined) {
      setupComplete = true;
      console.log(`[gemini] Setup complete ✓ — flushing ${audioQueue.length} queued chunk(s)`);
      while (audioQueue.length && geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(audioQueue.shift());
      }
      return;
    }

    const sc = msg.serverContent;
    if (!sc) return;

    // 2. Barge-in / interrupted (user spoke while AI was talking)
    if (sc.interrupted) {
      outputTranscript = '';
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'interrupted' }));
      }
    }

    // 3. User speech transcript (accumulates during turn)
    if (sc.inputTranscription?.text) {
      inputTranscript = sc.inputTranscription.text;
    }

    // 4. AI speech transcript (accumulates during turn)
    if (sc.outputTranscription?.text) {
      outputTranscript = sc.outputTranscription.text;
    }

    // 5. AI audio chunks → forward to browser for playback
    if (sc.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        const inline = part.inlineData || part.inline_data;
        if (!inline?.data) continue;
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'audio', data: inline.data }));
        }
      }
    }

    // 6. Turn complete — emit transcripts then signal UI
    if (sc.turnComplete) {
      const userText = inputTranscript.trim();
      const aiText   = outputTranscript.trim();

      if (userText) {
        await appendTranscript(sessionId, 'candidate', userText);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'text', role: 'candidate', content: userText }));
        }
      }
      if (aiText) {
        await appendTranscript(sessionId, 'interviewer', aiText);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'text', role: 'interviewer', content: aiText }));
        }
      }
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'turnComplete' }));
      }

      // Reset accumulators for next turn
      inputTranscript  = '';
      outputTranscript = '';
    }
  });

  // ── Browser → Gemini ────────────────────────────────────────────────────────
  clientWs.on('message', async (data) => {
    if (fellBack) return;
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'audio') {
      const payload = JSON.stringify({
        realtimeInput: {
          mediaChunks: [{ mimeType: 'audio/pcm;rate=16000', data: msg.data }],
        },
      });
      if (!setupComplete) {
        audioQueue.push(payload);
      } else if (geminiWs.readyState === WebSocket.OPEN) {
        geminiWs.send(payload);
      }
    }

    if (msg.type === 'text') {
      await appendTranscript(sessionId, 'candidate', msg.content);
      const payload = JSON.stringify({
        clientContent: {
          turns: [{ role: 'user', parts: [{ text: msg.content }] }],
          turnComplete: true,
        },
      });
      if (geminiWs.readyState === WebSocket.OPEN) geminiWs.send(payload);
    }

    if (msg.type === 'end') geminiWs.close();
  });

  clientWs.on('close', () => geminiWs.close());

  geminiWs.on('close', (code, reasonBuf) => {
    const reason = reasonBuf?.toString() || '(no reason)';
    console.log(`[gemini] WS closed — code: ${code}  reason: ${reason}`);
    if (!setupComplete) {
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

// ── Mock interview ─────────────────────────────────────────────────────────────
const MOCK_QUESTIONS = [
  "Hello! I'm your AI interviewer. Let's get started — can you briefly introduce yourself and walk me through your background?",
  "Great! Can you describe a challenging technical problem you've solved recently and how you approached it?",
  "How do you approach debugging a complex issue in a production system?",
  "Tell me about a time you worked with a team under pressure. How did you handle it?",
  "What aspects of this role excite you most, and how does it align with your career goals?",
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
