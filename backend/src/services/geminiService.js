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
  'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

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
    const setup = {
      setup: {
        model: 'models/gemini-2.0-flash-live-001',
        generation_config: {
          response_modalities: ['AUDIO'],
          speech_config: {
            voice_config: {
              prebuilt_voice_config: { voice_name: 'Charon' },
            },
          },
        },
        system_instruction: {
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
        const payload = JSON.stringify({
          realtime_input: {
            media_chunks: [{ mime_type: 'audio/pcm;rate=16000', data: msg.data }],
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
        const payload = JSON.stringify({
          client_content: {
            turns: [{ role: 'user', parts: [{ text: msg.content }] }],
            turn_complete: true,
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
  geminiWs.on('close', () => {
    if (clientWs.readyState === WebSocket.OPEN) clientWs.close();
  });
  geminiWs.on('error', (err) => {
    console.error('Gemini WS error:', err.message);
    clientWs.close(1011, 'Gemini connection error');
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

function handleMockInterview(clientWs, sessionId) {
  let questionIndex = 0;
  let silenceTimer  = null;
  let hasAudio      = false;   // did we receive at least one audio chunk?

  const sendNext = () => {
    silenceTimer = null;
    hasAudio     = false;
    if (questionIndex >= MOCK_QUESTIONS.length) {
      clientWs.send(JSON.stringify({ type: 'interviewEnd' }));
      return;
    }
    const content = MOCK_QUESTIONS[questionIndex++];
    appendTranscript(sessionId, 'interviewer', content);
    clientWs.send(JSON.stringify({ type: 'text', role: 'interviewer', content }));
    clientWs.send(JSON.stringify({ type: 'turnComplete' }));
  };

  // Send first question after a short delay
  setTimeout(sendNext, 1000);

  clientWs.on('message', async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'audio') {
        // Simulate VAD: advance to next question 2 s after the user stops sending audio
        hasAudio = true;
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(sendNext, 2000);
      }

      if (msg.type === 'text' && msg.content) {
        if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
        await appendTranscript(sessionId, 'candidate', msg.content);
        setTimeout(sendNext, 1500);
      }

      if (msg.type === 'end') {
        if (silenceTimer) clearTimeout(silenceTimer);
        clientWs.close();
      }
    } catch (e) {
      console.error('[mock] WS error:', e.message);
    }
  });
}

module.exports = { handleInterviewSocket };
