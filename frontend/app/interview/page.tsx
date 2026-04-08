'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateFeedback } from '@/lib/api';
import styles from './interview.module.css';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  timestamp: Date;
}

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

export default function InterviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [error, setError] = useState('');
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcript
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((role: 'interviewer' | 'candidate', content: string) => {
    setMessages((prev) => [...prev, { role, content, timestamp: new Date() }]);
  }, []);

  // Play PCM audio chunks from Gemini
  const playAudioChunk = useCallback(async (base64Data: string) => {
    if (!audioContextRef.current) return;

    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    // Gemini outputs 24kHz 16-bit PCM
    const sampleRate = 24000;
    const samples = bytes.length / 2;
    const buffer = audioContextRef.current.createBuffer(1, samples, sampleRate);
    const channelData = buffer.getChannelData(0);

    const view = new DataView(bytes.buffer);
    for (let i = 0; i < samples; i++) {
      channelData[i] = view.getInt16(i * 2, true) / 32768;
    }

    audioQueueRef.current.push(buffer);
    if (!isPlayingRef.current) drainAudioQueue();
  }, []);

  function drainAudioQueue() {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      setIsAISpeaking(false);
      return;
    }

    isPlayingRef.current = true;
    setIsAISpeaking(true);
    const buffer = audioQueueRef.current.shift()!;
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = drainAudioQueue;
    source.start();
  }

  // Capture microphone and stream PCM to backend WebSocket
  const startMicrophone = useCallback(async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const ctx = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || ws.readyState !== WebSocket.OPEN) return;

        const float32 = e.inputBuffer.getChannelData(0);
        // Convert Float32 → Int16 PCM
        const int16 = new Int16Array(float32.length);
        for (let i = 0; i < float32.length; i++) {
          int16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
        }

        const base64 = btoa(String.fromCharCode(...new Uint8Array(int16.buffer)));
        ws.send(JSON.stringify({ type: 'audio', data: base64 }));
      };

      source.connect(processor);
      processor.connect(ctx.destination);
    } catch (err) {
      console.error('Microphone error:', err);
      setError('Microphone access denied. You can still type your responses below.');
    }
  }, [isMuted]);

  // Connect to backend WebSocket
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      return;
    }

    const ws = new WebSocket(`${WS_BASE}/ws/interview?sessionId=${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('active');
      startMicrophone(ws);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === 'audio') {
          playAudioChunk(msg.data);
        }

        if (msg.type === 'text') {
          addMessage(msg.role, msg.content);
        }

        if (msg.type === 'turnComplete') {
          setIsAISpeaking(false);
        }

        if (msg.type === 'interviewEnd') {
          setStatus('ended');
        }
      } catch (e) {
        console.error('WS message parse error:', e);
      }
    };

    ws.onerror = () => setError('Connection error. Please refresh and try again.');
    ws.onclose = () => {
      if (status !== 'ended') setStatus('ended');
    };

    return () => {
      ws.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioContextRef.current?.close();
    };
  }, [sessionId]); // eslint-disable-line react-hooks/exhaustive-deps

  function sendTextMessage() {
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'text', content: textInput.trim() }));
    addMessage('candidate', textInput.trim());
    setTextInput('');
  }

  async function endInterview() {
    wsRef.current?.send(JSON.stringify({ type: 'end' }));
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus('ended');
  }

  async function handleGetFeedback() {
    if (!sessionId) return;
    setIsGeneratingFeedback(true);
    try {
      await generateFeedback(sessionId);
      router.push(`/feedback?sessionId=${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate feedback');
      setIsGeneratingFeedback(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={`${styles.statusDot} ${styles[status]}`} />
            <span className={styles.statusLabel}>
              {status === 'connecting' && 'Connecting...'}
              {status === 'active' && 'Interview in progress'}
              {status === 'ended' && 'Interview ended'}
            </span>
          </div>
          <div className={styles.headerRight}>
            {status === 'active' && (
              <>
                <button
                  className={`${styles.iconBtn} ${isMuted ? styles.muted : ''}`}
                  onClick={() => setIsMuted((m) => !m)}
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? '🔇' : '🎤'}
                </button>
                <button className={styles.endBtn} onClick={endInterview}>
                  End Interview
                </button>
              </>
            )}
          </div>
        </header>

        {/* AI Speaking Indicator */}
        {isAISpeaking && (
          <div className={styles.speakingBanner}>
            <span className={styles.speakingDots}>
              <span /><span /><span />
            </span>
            Interviewer is speaking...
          </div>
        )}

        {/* Transcript */}
        <div className={styles.transcript}>
          {messages.length === 0 && status === 'active' && (
            <div className={styles.waitingMsg}>Waiting for the interviewer to start...</div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`${styles.message} ${msg.role === 'interviewer' ? styles.interviewer : styles.candidate}`}
            >
              <div className={styles.avatar}>
                {msg.role === 'interviewer' ? 'AI' : 'You'}
              </div>
              <div className={styles.bubble}>
                <p>{msg.content}</p>
                <span className={styles.time}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {/* Text Input (fallback / supplement to voice) */}
        {status === 'active' && (
          <div className={styles.inputRow}>
            <input
              className={styles.textInput}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendTextMessage()}
              placeholder="Type your response (or speak)..."
            />
            <button
              className={styles.sendBtn}
              onClick={sendTextMessage}
              disabled={!textInput.trim()}
            >
              Send
            </button>
          </div>
        )}

        {/* Post-interview actions */}
        {status === 'ended' && (
          <div className={styles.endPanel}>
            <h2>Interview Complete</h2>
            <p>Great job! Ready to see how you did?</p>
            <button
              className={styles.feedbackBtn}
              onClick={handleGetFeedback}
              disabled={isGeneratingFeedback}
            >
              {isGeneratingFeedback ? (
                <><span className={styles.spinner} /> Generating feedback...</>
              ) : (
                'View Feedback'
              )}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
