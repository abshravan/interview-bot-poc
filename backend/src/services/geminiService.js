/**
 * Gemini Live — uses @google/genai SDK for BidiGenerateContent.
 *
 *   - model:   gemini-2.0-flash-live-001  (override via GEMINI_LIVE_MODEL)
 *   - input:   sendRealtimeInput (mic audio) + sendClientContent (typed text)
 *   - output:  AUDIO modality — audio played in browser, text used for transcript
 *   - barge-in: serverContent.interrupted
 */

const { GoogleGenAI, Modality } = require('@google/genai');
const WebSocket = require('ws');
const { Session } = require('../lib/store');

const DEFAULT_MODEL = 'gemini-2.0-flash-live-001';

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

// ── Main handler ───────────────────────────────────────────────────────────────
async function handleInterviewSocket(clientWs, sessionId) {
  // Prevent unhandled 'error' events from crashing the Node process
  clientWs.on('error', (err) => console.error('[gemini] clientWs error:', err.message));

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    clientWs.close(1011, 'GEMINI_API_KEY is not configured');
    return;
  }

  // Load session + resume
  let dbSession;
  try {
    dbSession = await Session.findById(sessionId).populate('resumeId');
    if (!dbSession) {
      clientWs.close(1011, 'Session not found');
      return;
    }
  } catch (err) {
    console.error('[gemini] DB error:', err.message);
    clientWs.close(1011, 'Database error');
    return;
  }

  const rawModel = (process.env.GEMINI_LIVE_MODEL || DEFAULT_MODEL).trim();
  // SDK expects the short name without "models/" prefix
  const modelId  = rawModel.startsWith('models/') ? rawModel.slice(7) : rawModel;

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { apiVersion: 'v1alpha' },
  });

  // Per-turn transcript accumulators
  let inputTranscript  = '';
  let outputTranscript = '';
  let liveSession      = null;

  // ── Message handler ────────────────────────────────────────────────────────
  function handleMessage(msg) {
    // 1. setupComplete — signal the model to start the interview.
    //    Send a bare turnComplete (no turns array) — tells Gemini "your turn, go ahead".
    if (msg.setupComplete !== undefined) {
      console.log('[gemini] Setup complete ✓ — sending turn trigger');
      liveSession.sendClientContent({ turnComplete: true });
      return;
    }

    // Log non-audio messages for visibility
    const preview = JSON.stringify(msg);
    if (!preview.includes('"inlineData"') && !preview.includes('"inline_data"')) {
      console.log('[gemini] ←', preview.slice(0, 300));
    }

    const sc = msg.serverContent;
    if (!sc) return;

    // 2. Barge-in
    if (sc.interrupted) {
      outputTranscript = '';
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'interrupted' }));
      }
    }

    // 3. Model turn parts — forward audio to browser
    if (sc.modelTurn?.parts) {
      for (const part of sc.modelTurn.parts) {
        const inline = part.inlineData || part.inline_data;
        if (inline?.data && clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'audio', data: inline.data }));
        }
        if (part.text) outputTranscript += part.text;
      }
    }

    // 4. Transcription fields
    if (sc.inputTranscription?.text)  inputTranscript  = sc.inputTranscription.text;
    if (sc.outputTranscription?.text) outputTranscript = sc.outputTranscription.text;

    // 5. Turn complete — persist and signal UI
    if (sc.turnComplete) {
      const userText = inputTranscript.trim();
      const aiText   = outputTranscript.trim();

      if (userText) {
        appendTranscript(sessionId, 'candidate', userText);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'text', role: 'candidate', content: userText }));
        }
      }
      if (aiText) {
        appendTranscript(sessionId, 'interviewer', aiText);
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'text', role: 'interviewer', content: aiText }));
        }
      }
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'turnComplete' }));
      }

      inputTranscript  = '';
      outputTranscript = '';
    }
  }

  // ── Connect to Gemini Live via SDK ─────────────────────────────────────────
  try {
    liveSession = await ai.live.connect({
      model: modelId,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Aoede' } },
        },
        systemInstruction: buildSystemPrompt(
          dbSession.role,
          dbSession.resumeId.text.slice(0, 3000)
        ),
      },
      callbacks: {
        onopen: () => console.log(`[gemini] SDK session open — model: ${modelId}`),
        onmessage: (msg) => {
          try { handleMessage(msg); }
          catch (e) { console.error('[gemini] handleMessage error:', e.message); }
        },
        onerror: (e) => {
          console.error('[gemini] SDK WS error:', e);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close(1011, 'Gemini connection error');
          }
        },
        onclose: (e) => {
          const code   = e?.code;
          const reason = e?.reason || '(none)';
          console.log(`[gemini] SDK session closed — code: ${code}  reason: ${reason}`);

          // On model-not-found, list available Live models to help with configuration
          if (code === 1008) {
            fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=100`)
              .then((r) => r.json())
              .then((data) => {
                const live = (data.models || []).filter((m) =>
                  (m.supportedGenerationMethods || []).includes('bidiGenerateContent')
                );
                if (live.length) {
                  console.log('\n[gemini] Models supporting bidiGenerateContent on your key:');
                  live.forEach((m) => console.log('  ·', m.name));
                  console.log('[gemini] → Set GEMINI_LIVE_MODEL=<name> in backend/.env\n');
                }
              })
              .catch(() => {});
          }

          const isErrorClose = code !== 1000 && code !== 1001;
          if (isErrorClose && clientWs.readyState === WebSocket.OPEN) {
            clientWs.close(1011, `Gemini session closed: ${code}`);
          } else if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.close();
          }
        },
      },
    });
  } catch (err) {
    console.error('[gemini] Failed to connect to Live API:', err.message);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(1011, err.message);
    }
    return;
  }

  // ── Browser → Gemini ────────────────────────────────────────────────────────
  clientWs.on('message', async (data) => {
    if (!liveSession) return;
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }

    if (msg.type === 'audio') {
      try {
        liveSession.sendRealtimeInput({
          audio: { data: msg.data, mimeType: 'audio/pcm;rate=16000' },
        });
      } catch (e) {
        console.error('[gemini] sendRealtimeInput error:', e.message);
      }
    }

    if (msg.type === 'text') {
      await appendTranscript(sessionId, 'candidate', msg.content);
      try {
        liveSession.sendClientContent({
          turns: [{ role: 'user', parts: [{ text: msg.content }] }],
          turnComplete: true,
        });
      } catch (e) {
        console.error('[gemini] sendClientContent error:', e.message);
      }
    }

    if (msg.type === 'end') {
      try { liveSession.close?.(); } catch {}
    }
  });

  clientWs.on('close', () => {
    try { liveSession?.close?.(); } catch {}
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

module.exports = { handleInterviewSocket };
