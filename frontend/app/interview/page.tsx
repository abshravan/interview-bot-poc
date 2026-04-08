'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Mic, MicOff, Send, PhoneOff, Star, ChevronRight,
  Volume2, Clock, MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateFeedback } from '@/lib/api';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  ts: Date;
}

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

/* ── Audio Visualizer ─────────────────────────────────────────────────────── */
function Visualizer({ active }: { active: boolean }) {
  const bars = [40, 65, 55, 90, 70, 80, 50, 75, 60, 85, 45, 70];
  return (
    <div className={`flex items-end gap-[3px] h-16 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-20'}`}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="audio-bar"
          style={{
            height: `${h}%`,
            animation: active ? `bar-wave 1s ${(i * 0.08).toFixed(2)}s ease-in-out infinite` : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ── AI Avatar ───────────────────────────────────────────────────────────── */
function AIAvatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ring */}
      {speaking && (
        <div className="absolute inset-0 rounded-full border border-benz-silver/20 animate-pulse-ring" />
      )}
      {/* Mid ring */}
      {speaking && (
        <div
          className="absolute rounded-full border border-benz-silver/10 animate-pulse-ring"
          style={{ inset: '-12px', animationDelay: '0.3s' }}
        />
      )}
      {/* Core */}
      <div
        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
          speaking
            ? 'bg-gradient-to-br from-benz-surface2 to-benz-dark border border-benz-silver/40 shadow-silver-glow'
            : 'bg-benz-surface2 border border-benz-border'
        }`}
      >
        <Star size={28} className={`transition-colors ${speaking ? 'text-benz-chrome' : 'text-benz-muted'}`} />
      </div>
    </div>
  );
}

/* ── Timer ───────────────────────────────────────────────────────────────── */
function Timer({ running }: { running: boolean }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return (
    <span className="text-xs text-benz-muted font-mono tabular-nums">
      {mm}:{ss}
    </span>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function InterviewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get('sessionId');

  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [muted, setMuted] = useState(false);
  const [aiSpeaking, setAISpeaking] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const queueRef = useRef<AudioBuffer[]>([]);
  const playingRef = useRef(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const addMsg = useCallback((role: 'interviewer' | 'candidate', content: string) => {
    setMessages((prev) => [...prev, { role, content, ts: new Date() }]);
  }, []);

  const playChunk = useCallback(async (b64: string) => {
    if (!audioCtxRef.current) return;
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const samples = bytes.length / 2;
    const buf = audioCtxRef.current.createBuffer(1, samples, 24000);
    const ch = buf.getChannelData(0);
    const view = new DataView(bytes.buffer);
    for (let i = 0; i < samples; i++) ch[i] = view.getInt16(i * 2, true) / 32768;
    queueRef.current.push(buf);
    if (!playingRef.current) drainQueue();
  }, []);

  function drainQueue() {
    if (!audioCtxRef.current || !queueRef.current.length) {
      playingRef.current = false;
      setAISpeaking(false);
      return;
    }
    playingRef.current = true;
    setAISpeaking(true);
    const src = audioCtxRef.current.createBufferSource();
    src.buffer = queueRef.current.shift()!;
    src.connect(audioCtxRef.current.destination);
    src.onended = drainQueue;
    src.start();
  }

  const startMic = useCallback(async (ws: WebSocket) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      proc.onaudioprocess = (e) => {
        if (muted || ws.readyState !== WebSocket.OPEN) return;
        const f32 = e.inputBuffer.getChannelData(0);
        const i16 = new Int16Array(f32.length);
        for (let i = 0; i < f32.length; i++)
          i16[i] = Math.max(-32768, Math.min(32767, f32[i] * 32768));
        const b64 = btoa(String.fromCharCode(...new Uint8Array(i16.buffer)));
        ws.send(JSON.stringify({ type: 'audio', data: b64 }));
      };
      src.connect(proc);
      proc.connect(ctx.destination);
    } catch {
      setError('Microphone access denied — you can still type responses below.');
    }
  }, [muted]);

  useEffect(() => {
    if (!sessionId) { setError('No session ID.'); return; }
    const ws = new WebSocket(`${WS_BASE}/ws/interview?sessionId=${sessionId}`);
    wsRef.current = ws;
    ws.onopen = () => { setStatus('active'); startMic(ws); };
    ws.onmessage = ({ data }) => {
      try {
        const msg = JSON.parse(data);
        if (msg.type === 'audio') playChunk(msg.data);
        if (msg.type === 'text') addMsg(msg.role, msg.content);
        if (msg.type === 'turnComplete') setAISpeaking(false);
        if (msg.type === 'interviewEnd') setStatus('ended');
      } catch {}
    };
    ws.onerror = () => setError('Connection error.');
    ws.onclose = () => setStatus((s) => (s !== 'ended' ? 'ended' : s));
    return () => {
      ws.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioCtxRef.current?.close();
    };
  }, [sessionId]); // eslint-disable-line

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send() {
    const c = text.trim();
    if (!c || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'text', content: c }));
    addMsg('candidate', c);
    setText('');
  }

  function end() {
    wsRef.current?.send(JSON.stringify({ type: 'end' }));
    wsRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setStatus('ended');
  }

  async function viewFeedback() {
    if (!sessionId) return;
    setFeedbackLoading(true);
    try {
      await generateFeedback(sessionId);
      router.push(`/feedback?sessionId=${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate feedback');
      setFeedbackLoading(false);
    }
  }

  // ── Layout ──
  return (
    <div className="min-h-screen bg-benz-black flex flex-col">
      {/* ── Header bar ── */}
      <header className="glass border-b border-benz-border/50 px-6 h-16 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-benz-muted" />
            <span className="text-xs tracking-[0.2em] uppercase text-benz-silver">InterviewAI</span>
          </div>
          <div className="h-4 w-px bg-benz-border" />
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                status === 'connecting' ? 'bg-amber-400 animate-pulse' :
                status === 'active'     ? 'bg-emerald-400 animate-pulse' :
                'bg-benz-muted'
              }`}
            />
            <span className="text-xs text-benz-muted uppercase tracking-widest">
              {status === 'connecting' ? 'Connecting' :
               status === 'active'     ? 'Live' :
               'Ended'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {status === 'active' && (
            <div className="flex items-center gap-1.5 text-benz-muted">
              <Clock size={12} />
              <Timer running={status === 'active'} />
            </div>
          )}
          <Badge variant="default">
            <MessageSquare size={10} className="mr-1" />
            {messages.length} messages
          </Badge>
          {status === 'active' && (
            <Button variant="destructive" size="sm" onClick={end}>
              <PhoneOff size={14} /> End
            </Button>
          )}
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* ── AI Panel ── */}
        <div className="hidden lg:flex w-72 border-r border-benz-border flex-col items-center justify-center gap-8 bg-benz-dark/50 p-8">
          <AIAvatar speaking={aiSpeaking} />

          <div className="text-center">
            <p className="text-sm font-medium text-benz-chrome">AI Interviewer</p>
            <p className="text-xs text-benz-muted mt-1 tracking-widest uppercase">
              {aiSpeaking ? 'Speaking...' : status === 'active' ? 'Listening' : 'Offline'}
            </p>
          </div>

          <Visualizer active={aiSpeaking} />

          {/* Mic toggle */}
          {status === 'active' && (
            <button
              onClick={() => setMuted((m) => !m)}
              className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-200 ${
                muted
                  ? 'bg-red-500/10 border-red-500/40 text-red-400 hover:bg-red-500/20'
                  : 'bg-benz-surface2 border-benz-border text-benz-silver hover:border-benz-silver/50 hover:shadow-silver-glow'
              }`}
            >
              {muted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          {muted && (
            <p className="text-xs text-red-400 text-center -mt-4">Muted</p>
          )}
        </div>

        {/* ── Transcript + Input ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Transcript */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {messages.length === 0 && status === 'active' && (
              <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
                <div className="w-16 h-16 rounded-full bg-benz-surface2 border border-benz-border flex items-center justify-center animate-float">
                  <Volume2 size={24} className="text-benz-muted" />
                </div>
                <p className="text-sm text-benz-muted">Waiting for the interviewer to start...</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex gap-3 animate-fade-in ${m.role === 'candidate' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-semibold shrink-0 border ${
                    m.role === 'interviewer'
                      ? 'bg-benz-surface2 border-benz-silver/30 text-benz-silver'
                      : 'bg-benz-chrome/10 border-benz-chrome/30 text-benz-chrome'
                  }`}
                >
                  {m.role === 'interviewer' ? 'AI' : 'Me'}
                </div>

                {/* Bubble */}
                <div className={`max-w-[70%] ${m.role === 'candidate' ? 'items-end' : ''} flex flex-col gap-1`}>
                  <div
                    className={`px-4 py-3 rounded-sm text-sm leading-relaxed ${
                      m.role === 'interviewer'
                        ? 'bg-benz-surface border border-benz-border text-benz-chrome rounded-tl-none'
                        : 'bg-benz-silver/10 border border-benz-silver/20 text-benz-chrome rounded-tr-none'
                    }`}
                  >
                    {m.content}
                  </div>
                  <span className="text-[10px] text-benz-muted px-1">
                    {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* AI typing indicator */}
            {aiSpeaking && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-sm bg-benz-surface2 border border-benz-silver/30 flex items-center justify-center text-xs font-semibold text-benz-silver shrink-0">
                  AI
                </div>
                <div className="px-4 py-3 rounded-sm bg-benz-surface border border-benz-border rounded-tl-none flex items-center gap-1.5">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="w-1.5 h-1.5 rounded-full bg-benz-silver/60 animate-bounce"
                      style={{ animationDelay: `${d * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Error */}
          {error && (
            <p className="mx-6 mb-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2">
              {error}
            </p>
          )}

          {/* Input */}
          {status === 'active' && (
            <div className="border-t border-benz-border p-4 flex gap-3">
              {/* Mobile mic toggle */}
              <button
                onClick={() => setMuted((m) => !m)}
                className={`lg:hidden w-11 h-11 rounded-sm flex items-center justify-center border transition-all ${
                  muted
                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                    : 'bg-benz-surface2 border-benz-border text-benz-silver'
                }`}
              >
                {muted ? <MicOff size={16} /> : <Mic size={16} />}
              </button>

              <input
                className="flex-1 h-11 bg-benz-surface2 border border-benz-border rounded-sm px-4 text-sm text-benz-chrome placeholder:text-benz-muted focus:outline-none focus:border-benz-silver/60 transition-colors"
                placeholder="Type your response (or speak)..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button
                onClick={send}
                disabled={!text.trim()}
                className="w-11 h-11 rounded-sm bg-benz-chrome text-benz-black flex items-center justify-center hover:bg-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send size={16} />
              </button>
            </div>
          )}

          {/* End screen */}
          {status === 'ended' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-md animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-benz-surface border border-benz-border mx-auto mb-6 flex items-center justify-center">
                  <Star size={32} className="text-benz-silver" />
                </div>
                <h2 className="text-2xl font-light text-benz-chrome mb-3">Interview Complete</h2>
                <p className="text-benz-muted text-sm mb-8 leading-relaxed">
                  Great work. You can now review your detailed performance analysis.
                </p>
                <Button size="lg" className="gap-3" onClick={viewFeedback} disabled={feedbackLoading}>
                  {feedbackLoading ? (
                    <span className="w-4 h-4 border-2 border-benz-black/30 border-t-benz-black rounded-full animate-spin" />
                  ) : (
                    <>View Performance Report <ChevronRight size={16} /></>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
