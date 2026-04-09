'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mic, MicOff, Send, PhoneOff, Star, ChevronRight, Clock, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { generateFeedback } from '@/lib/api';
import ProtectedRoute from '@/components/protected-route';

interface Message {
  role: 'interviewer' | 'candidate';
  content: string;
  ts: Date;
}

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:4000';

/* ── Visualizer ────────────────────────────────────────────────────────────── */
function Visualizer({ active }: { active: boolean }) {
  const bars = [42, 68, 54, 92, 72, 82, 50, 76, 60, 84, 46, 70];
  return (
    <div className={`flex items-end gap-[3px] h-12 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-15'}`}>
      {bars.map((h, i) => (
        <div
          key={i}
          className="audio-bar"
          style={{
            height: `${h}%`,
            animation: active
              ? `bar-wave 1.1s ${(i * 0.08).toFixed(2)}s ease-in-out infinite`
              : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ── AI Avatar ─────────────────────────────────────────────────────────────── */
function AIAvatar({ speaking }: { speaking: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      {speaking && <>
        <div className="absolute inset-0 rounded-full border border-benz-silver/15 animate-pulse-ring" />
        <div className="absolute rounded-full border border-benz-silver/08 animate-pulse-ring"
             style={{ inset: '-14px', animationDelay: '0.35s' }} />
      </>}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
        speaking
          ? 'bg-gradient-to-br from-benz-surface2 to-benz-dark border border-benz-silver/30 shadow-glow-silver'
          : 'bg-benz-surface border border-benz-border'
      }`}>
        <Star size={26} className={`transition-colors duration-300 ${speaking ? 'text-benz-chrome' : 'text-benz-muted'}`} />
      </div>
    </div>
  );
}

/* ── Timer ─────────────────────────────────────────────────────────────────── */
function Timer({ running }: { running: boolean }) {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return <span className="font-mono tabular-nums text-xs text-benz-muted">{mm}:{ss}</span>;
}

/* ── Main ──────────────────────────────────────────────────────────────────── */
export default function InterviewPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get('sessionId');

  const [messages, setMessages]         = useState<Message[]>([]);
  const [status, setStatus]             = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [muted, setMuted]               = useState(false);
  const [aiSpeaking, setAISpeaking]     = useState(false);
  const [listening, setListening]       = useState(false);
  const [text, setText]                 = useState('');
  const [error, setError]               = useState('');
  const [feedbackLoading, setFbLoading] = useState(false);

  const wsRef          = useRef<WebSocket | null>(null);
  const recognitionRef = useRef<any>(null);
  const mutedRef       = useRef(false);
  const bottomRef      = useRef<HTMLDivElement>(null);

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  const addMsg = useCallback((role: 'interviewer' | 'candidate', content: string) => {
    setMessages((prev) => [...prev, { role, content, ts: new Date() }]);
  }, []);

  /* ── Text-to-speech (AI speaks its response) ─────────────────────────────── */
  const speak = useCallback((utteranceText: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(utteranceText);
    u.rate  = 0.95;
    u.pitch = 1.0;
    u.onstart = () => setAISpeaking(true);
    u.onend   = () => setAISpeaking(false);
    u.onerror = () => setAISpeaking(false);
    window.speechSynthesis.speak(u);
  }, []);

  /* ── Speech recognition (user speaks, browser transcribes) ──────────────── */
  const startRecognition = useCallback((ws: WebSocket) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition not supported in this browser — use Chrome or Edge, or type below.');
      return;
    }
    const rec: any = new SR();
    rec.continuous      = true;
    rec.interimResults  = false;
    rec.lang            = 'en-US';

    rec.onstart = () => setListening(true);
    rec.onend   = () => {
      setListening(false);
      // Auto-restart so recognition stays live for the whole interview
      if (!mutedRef.current && ws.readyState === WebSocket.OPEN) {
        setTimeout(() => { try { rec.start(); } catch {} }, 200);
      }
    };
    rec.onresult = (e: any) => {
      const transcript = e.results[e.results.length - 1][0].transcript.trim();
      if (!transcript || mutedRef.current || ws.readyState !== WebSocket.OPEN) return;
      addMsg('candidate', transcript);
      ws.send(JSON.stringify({ type: 'text', content: transcript }));
    };
    rec.onerror = (e: any) => {
      // 'no-speech' and 'aborted' are normal; surface real errors
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      setError(`Mic error: ${e.error} — you can type below instead.`);
    };

    recognitionRef.current = rec;
    rec.start();
  }, [addMsg]);

  /* ── WebSocket lifecycle ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!sessionId) { setError('No session ID.'); return; }

    const ws = new WebSocket(`${WS_BASE}/ws/interview?sessionId=${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => { setStatus('active'); startRecognition(ws); };

    ws.onmessage = ({ data }) => {
      try {
        const m = JSON.parse(data);
        if (m.type === 'text') {
          addMsg(m.role, m.content);
          if (m.role === 'interviewer') speak(m.content);
        }
        if (m.type === 'turnComplete') setAISpeaking(false);
        if (m.type === 'interviewEnd') setStatus('ended');
      } catch {}
    };

    ws.onerror = () => setError('Connection error.');
    ws.onclose = () => setStatus((s) => s !== 'ended' ? 'ended' : s);

    return () => {
      ws.close();
      try { recognitionRef.current?.stop(); } catch {}
      window.speechSynthesis?.cancel();
    };
  }, [sessionId]); // eslint-disable-line

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  /* ── Mute toggle ─────────────────────────────────────────────────────────── */
  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    if (next) {
      try { recognitionRef.current?.stop(); } catch {}
      setListening(false);
    } else {
      const ws = wsRef.current;
      if (ws?.readyState === WebSocket.OPEN) {
        try { recognitionRef.current?.start(); } catch {}
      }
    }
  }

  /* ── Text fallback send ──────────────────────────────────────────────────── */
  function send() {
    const c = text.trim();
    if (!c || wsRef.current?.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ type: 'text', content: c }));
    addMsg('candidate', c);
    setText('');
  }

  function end() {
    wsRef.current?.send(JSON.stringify({ type: 'end' }));
    wsRef.current?.close();
    try { recognitionRef.current?.stop(); } catch {}
    window.speechSynthesis?.cancel();
    setStatus('ended');
  }

  async function viewFeedback() {
    if (!sessionId) return;
    setFbLoading(true);
    try {
      await generateFeedback(sessionId);
      router.push(`/feedback?sessionId=${sessionId}`);
    } catch (err: any) {
      setError(err.message); setFbLoading(false);
    }
  }

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-benz-black flex flex-col">

      {/* Header */}
      <header className="glass border-b border-white/[0.04] px-5 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Star size={12} className="text-benz-muted" />
            <span className="text-xs font-medium text-benz-silver">InterviewAI</span>
          </div>
          <div className="h-3.5 w-px bg-benz-border" />
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${
              status === 'connecting' ? 'bg-amber-400 animate-pulse' :
              status === 'active'     ? 'bg-emerald-400 animate-pulse' :
              'bg-benz-muted'}`} />
            <span className="text-[0.7rem] text-benz-muted uppercase tracking-wide">
              {status === 'connecting' ? 'Connecting' : status === 'active' ? 'Live' : 'Ended'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {status === 'active' && (
            <div className="flex items-center gap-1 text-benz-muted">
              <Clock size={11} />
              <Timer running />
            </div>
          )}
          {/* Listening indicator */}
          {status === 'active' && listening && !muted && (
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[0.65rem] uppercase tracking-wide">Listening</span>
            </div>
          )}
          <Badge variant="default" className="gap-1">
            <MessageSquare size={9} />
            {messages.length}
          </Badge>
          {status === 'active' && (
            <Button variant="destructive" size="sm" onClick={end}>
              <PhoneOff size={13} /> End
            </Button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">

        {/* AI panel */}
        <div className="hidden lg:flex w-64 border-r border-benz-border flex-col items-center justify-center gap-7 bg-benz-dark/40 py-10 px-6">
          <AIAvatar speaking={aiSpeaking} />
          <div className="text-center">
            <p className="text-sm font-medium text-benz-chrome">AI Interviewer</p>
            <p className="text-[0.65rem] text-benz-muted mt-1 uppercase tracking-wide">
              {aiSpeaking ? 'Speaking…' : listening && !muted ? 'Listening' : status === 'active' ? 'Ready' : 'Offline'}
            </p>
          </div>
          <Visualizer active={aiSpeaking} />
          {status === 'active' && (
            <button
              onClick={toggleMute}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-200 ${
                muted
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  : listening
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                    : 'bg-benz-surface border-benz-border text-benz-silver hover:border-benz-border-2 hover:shadow-glow-silver'
              }`}
            >
              {muted ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}
          {muted && <p className="text-[0.65rem] text-red-400 -mt-4">Microphone muted</p>}
          {!muted && listening && <p className="text-[0.65rem] text-emerald-400 -mt-4">Mic active</p>}
        </div>

        {/* Transcript + input */}
        <div className="flex-1 flex flex-col min-h-0">

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3.5 no-scrollbar">
            {messages.length === 0 && status === 'active' && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center opacity-60">
                <div className="w-12 h-12 rounded-full bg-benz-surface border border-benz-border flex items-center justify-center animate-float">
                  <Star size={20} className="text-benz-muted" />
                </div>
                <p className="text-sm text-benz-muted">Waiting for the interviewer…</p>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 animate-fade-in ${m.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-semibold border shrink-0 ${
                  m.role === 'interviewer'
                    ? 'bg-benz-surface2 border-benz-silver/20 text-benz-silver'
                    : 'bg-benz-chrome/[0.08] border-benz-chrome/20 text-benz-chrome'
                }`}>
                  {m.role === 'interviewer' ? 'AI' : 'Me'}
                </div>

                <div className={`flex flex-col gap-1 max-w-[72%] ${m.role === 'candidate' ? 'items-end' : ''}`}>
                  <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                    m.role === 'interviewer'
                      ? 'bg-benz-surface border border-benz-border text-benz-chrome rounded-2xl rounded-tl-sm'
                      : 'bg-benz-silver/[0.08] border border-benz-silver/15 text-benz-chrome rounded-2xl rounded-tr-sm'
                  }`}>
                    {m.content}
                  </div>
                  <span className="text-[10px] text-benz-muted px-1">
                    {m.ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Typing indicator while AI is thinking/speaking */}
            {aiSpeaking && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="w-7 h-7 rounded-lg bg-benz-surface2 border border-benz-silver/20 flex items-center justify-center text-[11px] text-benz-silver shrink-0">AI</div>
                <div className="px-4 py-3 bg-benz-surface border border-benz-border rounded-2xl rounded-tl-sm flex items-center gap-1">
                  {[0,1,2].map((d) => (
                    <span key={d} className="w-1.5 h-1.5 rounded-full bg-benz-silver/50 animate-bounce" style={{ animationDelay: `${d*0.14}s` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {error && (
            <p className="mx-5 mb-2 text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          {/* Input bar */}
          {status === 'active' && (
            <div className="border-t border-benz-border px-4 py-3 flex gap-2.5">
              <button
                onClick={toggleMute}
                className={`lg:hidden w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  muted
                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                    : listening
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-benz-surface2 border-benz-border text-benz-silver'
                }`}
              >
                {muted ? <MicOff size={15} /> : <Mic size={15} />}
              </button>

              <input
                className="flex-1 h-10 bg-benz-surface border border-benz-border rounded-xl px-4 text-sm text-benz-chrome placeholder:text-benz-muted/60 focus:outline-none focus:border-benz-border-2 focus:ring-2 focus:ring-benz-silver/10 transition-all"
                placeholder={listening && !muted ? 'Listening… or type here' : 'Type your response…'}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
              />
              <button
                onClick={send}
                disabled={!text.trim()}
                className="w-10 h-10 rounded-xl bg-benz-chrome text-benz-black flex items-center justify-center hover:bg-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={15} />
              </button>
            </div>
          )}

          {/* End screen */}
          {status === 'ended' && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center max-w-sm animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-benz-surface border border-benz-border mx-auto mb-5 flex items-center justify-center">
                  <Star size={28} className="text-benz-silver" />
                </div>
                <h2 className="text-xl font-light text-benz-chrome mb-2">Interview Complete</h2>
                <p className="text-sm text-benz-muted mb-7 leading-relaxed">
                  Great work. Ready to see your performance analysis?
                </p>
                <Button size="lg" className="gap-2" onClick={viewFeedback} disabled={feedbackLoading}>
                  {feedbackLoading
                    ? <span className="w-4 h-4 rounded-full border-2 border-benz-black/25 border-t-benz-black animate-spin" />
                    : <><span>View Performance Report</span><ChevronRight size={15} /></>}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
