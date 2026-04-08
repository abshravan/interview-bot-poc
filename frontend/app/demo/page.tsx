'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star, Mic, MicOff, Send, PhoneOff, CheckCircle, TrendingDown,
  FileText, ChevronRight, RotateCcw, Zap, Play, ArrowLeft,
  BarChart2, User, Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// ── Dummy data ──────────────────────────────────────────────────────────────
const DUMMY_TRANSCRIPT = [
  { role: 'interviewer', content: "Hello! I'm your AI interviewer today. I've reviewed your resume and I'm excited to chat. Let's start — can you briefly walk me through your background and what led you to software engineering?" },
  { role: 'candidate',   content: "Sure! I have about 5 years of experience in full-stack development. I started with backend work in Node.js and gradually moved into React for the frontend. I really enjoy building scalable APIs and clean user interfaces." },
  { role: 'interviewer', content: "Great overview. I noticed you listed a microservices project on your resume. Can you describe the architecture you chose and the trade-offs you encountered?" },
  { role: 'candidate',   content: "We used a service-mesh approach with Kubernetes. The main trade-off was operational complexity versus scalability. We ended up isolating our user service and payments service first, which gave us the most value early on." },
  { role: 'interviewer', content: "Interesting. How did you handle inter-service communication — REST or event-driven?" },
  { role: 'candidate',   content: "Mostly REST for synchronous operations, but we adopted Kafka for async events like order processing and notifications. That reduced coupling significantly." },
  { role: 'interviewer', content: "Good choice. Last question — how do you approach debugging a production incident at 3 AM?" },
  { role: 'candidate',   content: "First I check our alerting dashboard and trace the error through our logging stack — we use ELK. I isolate which service is failing, check recent deploys, and if needed I roll back. I always write a post-mortem after." },
];

const DUMMY_FEEDBACK = {
  communicationScore: 8,
  technicalScore:     7,
  strengths: [
    'Clear and structured communication throughout the interview',
    'Strong understanding of microservices architecture and trade-offs',
    'Proactive approach to production incidents with systematic debugging',
  ],
  weaknesses: [
    'Could elaborate more on specific metrics and outcomes',
    'Missed opportunity to discuss monitoring and observability deeper',
  ],
  suggestions: [
    'Use the STAR method to quantify achievements (e.g. "reduced latency by 40%")',
    'Prepare deeper dives on system design — CAP theorem, eventual consistency',
    'Practice explaining complex topics at varying levels of detail',
  ],
};

// ── Score Ring ──────────────────────────────────────────────────────────────
function ScoreRing({ score, label, delay = 0 }: { score: number; label: string; delay?: number }) {
  const [d, setD] = useState(0);
  const r = 36; const circ = 2 * Math.PI * r;
  const ringColor = score >= 8 ? '#4CAF89' : score >= 6 ? '#C8C8C8' : '#F59E0B';

  useEffect(() => {
    const t = setTimeout(() => {
      let n = 0;
      const id = setInterval(() => {
        n += 0.3; if (n >= score) { n = score; clearInterval(id); }
        setD(n);
      }, 25);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke="#1E1E1E" strokeWidth="7" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={ringColor} strokeWidth="7"
          strokeDasharray={circ} strokeDashoffset={circ - (d / 10) * circ}
          strokeLinecap="round" transform="rotate(-90 45 45)" className="score-ring-progress"
          style={{ filter: `drop-shadow(0 0 6px ${ringColor}50)` }} />
        <text x="45" y="50" textAnchor="middle" fill="#E8E8E8" fontSize="18" fontWeight="600" fontFamily="system-ui">
          {d.toFixed(0)}
        </text>
      </svg>
      <p className="text-xs text-benz-muted tracking-widest uppercase">{label}</p>
    </div>
  );
}

// ── Mock Live Interview Demo ─────────────────────────────────────────────────
function LiveInterviewDemo() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const visible = DUMMY_TRANSCRIPT.slice(0, step);

  function next() {
    if (step >= DUMMY_TRANSCRIPT.length) return;
    setTyping(true);
    setTimeout(() => {
      setStep((s) => s + 1);
      setTyping(false);
    }, 1200);
  }

  function startDemo() {
    setRunning(true);
    setStep(0);
    let s = 0;
    const run = () => {
      if (s >= DUMMY_TRANSCRIPT.length) { setRunning(false); return; }
      setTyping(true);
      setTimeout(() => {
        s++; setStep(s); setTyping(false);
        setTimeout(run, 1800);
      }, 1000);
    };
    setTimeout(run, 500);
  }

  return (
    <div className="rounded-sm border border-benz-border overflow-hidden">
      {/* Mock header */}
      <div className="glass border-b border-benz-border px-4 h-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-benz-muted uppercase tracking-widest">Live Demo</span>
        </div>
        <div className="flex items-center gap-2">
          {!running && step < DUMMY_TRANSCRIPT.length && (
            <Button size="sm" variant="outline" onClick={startDemo} className="h-7 text-xs">
              <Play size={11} /> Auto Play
            </Button>
          )}
          {(running || step > 0) && (
            <Button size="sm" variant="ghost" onClick={() => { setStep(0); setRunning(false); }} className="h-7 text-xs">
              <RotateCcw size={11} /> Reset
            </Button>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="bg-benz-dark h-80 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {visible.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-benz-surface2 border border-benz-border flex items-center justify-center animate-float">
              <Volume2 size={20} className="text-benz-muted" />
            </div>
            <p className="text-sm text-benz-muted">Click "Auto Play" to watch a mock interview</p>
          </div>
        )}
        {visible.map((m, i) => (
          <div key={i} className={`flex gap-2 animate-fade-in ${m.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold border shrink-0 ${
              m.role === 'interviewer'
                ? 'bg-benz-surface2 border-benz-silver/30 text-benz-silver'
                : 'bg-benz-chrome/10 border-benz-chrome/30 text-benz-chrome'
            }`}>
              {m.role === 'interviewer' ? 'AI' : 'Me'}
            </div>
            <div className={`max-w-[78%] px-3 py-2 rounded-sm text-xs leading-relaxed ${
              m.role === 'interviewer'
                ? 'bg-benz-surface border border-benz-border text-benz-chrome rounded-tl-none'
                : 'bg-benz-silver/10 border border-benz-silver/20 text-benz-chrome rounded-tr-none'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-7 h-7 rounded-sm bg-benz-surface2 border border-benz-silver/30 flex items-center justify-center text-xs text-benz-silver shrink-0">
              {DUMMY_TRANSCRIPT[step]?.role === 'candidate' ? 'Me' : 'AI'}
            </div>
            <div className="px-3 py-2 rounded-sm bg-benz-surface border border-benz-border flex items-center gap-1.5">
              {[0,1,2].map((d) => (
                <span key={d} className="w-1.5 h-1.5 rounded-full bg-benz-silver/60 animate-bounce" style={{ animationDelay: `${d*0.15}s` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mock input bar */}
      <div className="border-t border-benz-border p-3 flex gap-2 bg-benz-dark">
        <input
          className="flex-1 h-9 bg-benz-surface2 border border-benz-border rounded-sm px-3 text-xs text-benz-chrome placeholder:text-benz-muted focus:outline-none"
          placeholder="Type your response..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          readOnly
        />
        <button className="w-9 h-9 rounded-sm bg-benz-chrome text-benz-black flex items-center justify-center opacity-40 cursor-not-allowed">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Mock Feedback Demo ───────────────────────────────────────────────────────
function FeedbackDemo() {
  const overall = (DUMMY_FEEDBACK.communicationScore + DUMMY_FEEDBACK.technicalScore) / 2;
  return (
    <div className="space-y-6">
      {/* Score rings */}
      <div className="flex items-center justify-around py-4">
        <ScoreRing score={DUMMY_FEEDBACK.communicationScore} label="Communication" delay={100} />
        <div className="text-center">
          <p className="text-5xl font-light text-benz-chrome">{overall.toFixed(1)}</p>
          <p className="text-xs text-benz-muted tracking-widest uppercase mt-1">Overall</p>
          <Badge variant="silver" className="mt-2">Good</Badge>
        </div>
        <ScoreRing score={DUMMY_FEEDBACK.technicalScore} label="Technical" delay={300} />
      </div>

      <Separator />

      {/* Score bars */}
      <div className="space-y-3">
        {[
          { label: 'Communication', v: DUMMY_FEEDBACK.communicationScore * 10 },
          { label: 'Technical',     v: DUMMY_FEEDBACK.technicalScore * 10 },
        ].map(({ label, v }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-benz-muted uppercase tracking-widest">{label}</span>
              <span className="text-benz-chrome">{v / 10}/10</span>
            </div>
            <Progress value={v} />
          </div>
        ))}
      </div>

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="s">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="s">Strengths</TabsTrigger>
          <TabsTrigger value="w">Improve</TabsTrigger>
          <TabsTrigger value="a">Actions</TabsTrigger>
        </TabsList>
        <TabsContent value="s" className="space-y-2">
          {DUMMY_FEEDBACK.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-sm bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-benz-chrome leading-relaxed">{s}</p>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="w" className="space-y-2">
          {DUMMY_FEEDBACK.weaknesses.map((w, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-sm bg-amber-500/5 border border-amber-500/20">
              <TrendingDown size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-benz-chrome leading-relaxed">{w}</p>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="a" className="space-y-2">
          {DUMMY_FEEDBACK.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 p-3 rounded-sm bg-benz-surface border border-benz-border">
              <div className="w-5 h-5 rounded-sm bg-benz-surface2 flex items-center justify-center text-[10px] text-benz-muted shrink-0">{i+1}</div>
              <p className="text-xs text-benz-chrome leading-relaxed">{s}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Main Demo Page ───────────────────────────────────────────────────────────
export default function DemoPage() {
  return (
    <div className="min-h-screen bg-benz-black">
      {/* Header */}
      <header className="glass border-b border-benz-border/50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-benz-muted hover:text-benz-silver transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div className="h-4 w-px bg-benz-border" />
          <Star size={14} className="text-benz-muted" />
          <span className="text-xs tracking-[0.2em] uppercase text-benz-silver">
            Interview<span className="text-benz-chrome font-semibold">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="gold">
            <Zap size={10} className="mr-1" />
            Demo Mode
          </Badge>
          <Link href="/login">
            <Button size="sm">Get Started <ChevronRight size={12} /></Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 px-6 text-center border-b border-benz-border overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="max-w-2xl mx-auto relative">
          <Badge variant="silver" className="mb-6 mx-auto gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-benz-silver animate-pulse" />
            Interactive Preview
          </Badge>
          <h1 className="text-4xl md:text-5xl font-light text-benz-chrome mb-4 animate-fade-in">
            See It In Action
          </h1>
          <p className="text-benz-muted text-lg animate-fade-in-delay max-w-lg mx-auto">
            Explore a complete mock interview session — from upload to live conversation to detailed feedback.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8 animate-fade-in-delay2">
            <Link href="/login">
              <Button size="lg" className="gap-2">
                <Mic size={16} /> Start Your Interview
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="lg">Learn More</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-16 space-y-20">

        {/* ── Section 1: Resume Upload Demo ── */}
        <section>
          <div className="flex items-start gap-4 mb-8">
            <div className="w-8 h-8 rounded-sm bg-benz-surface2 border border-benz-border flex items-center justify-center text-xs font-semibold text-benz-silver shrink-0">
              01
            </div>
            <div>
              <h2 className="text-xl font-light text-benz-chrome">Upload Your Resume</h2>
              <p className="text-benz-muted text-sm mt-1">Drop a PDF — our parser extracts and understands your experience instantly.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Upload zone mock */}
            <Card className="hover-lift">
              <CardContent className="p-6">
                <div className="rounded-sm border-2 border-dashed border-emerald-500/40 bg-emerald-500/5 p-8 text-center">
                  <div className="w-12 h-12 rounded-sm bg-emerald-500/10 border border-emerald-500/30 mx-auto mb-4 flex items-center justify-center text-emerald-400">
                    <FileText size={24} />
                  </div>
                  <p className="text-sm font-medium text-benz-chrome">john_doe_resume.pdf</p>
                  <p className="text-xs text-emerald-400 mt-1">124 KB · Parsed successfully</p>
                </div>
                <div className="mt-4 p-3 rounded-sm bg-benz-surface2 border border-benz-border">
                  <p className="text-xs text-benz-muted mb-1 uppercase tracking-widest">Extracted preview</p>
                  <p className="text-xs text-benz-chrome leading-relaxed line-clamp-3">
                    John Doe · Senior Software Engineer · 5 years experience · Node.js, React, PostgreSQL, Kubernetes · Led migration of monolith to microservices…
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Role selection mock */}
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Role Selected</CardTitle>
                <CardDescription>Interview tailored to your chosen position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {['Software Engineer', 'Backend Engineer', 'Full Stack', 'DevOps', 'Data Scientist', 'ML Engineer'].map((r, i) => (
                    <div
                      key={r}
                      className={`px-3 py-2 rounded-sm border text-xs transition-all ${
                        i === 0
                          ? 'bg-benz-silver/15 border-benz-silver/60 text-benz-chrome'
                          : 'bg-benz-surface border-benz-border text-benz-muted'
                      }`}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="benz-divider" />

        {/* ── Section 2: Live Interview Demo ── */}
        <section>
          <div className="flex items-start gap-4 mb-8">
            <div className="w-8 h-8 rounded-sm bg-benz-surface2 border border-benz-border flex items-center justify-center text-xs font-semibold text-benz-silver shrink-0">
              02
            </div>
            <div>
              <h2 className="text-xl font-light text-benz-chrome">Live Voice Interview</h2>
              <p className="text-benz-muted text-sm mt-1">
                Real-time conversation with Gemini Live — asks follow-ups based on your answers.
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* AI avatar panel */}
            <Card className="flex flex-col items-center justify-center p-8 gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border border-benz-silver/20 animate-pulse-ring" />
                <div className="w-20 h-20 rounded-full bg-benz-surface2 border border-benz-silver/30 shadow-silver-glow flex items-center justify-center">
                  <Star size={28} className="text-benz-chrome" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-benz-chrome">AI Interviewer</p>
                <p className="text-xs text-benz-muted mt-1 tracking-widest uppercase">Speaking</p>
              </div>
              {/* Visualizer */}
              <div className="flex items-end gap-[3px] h-10">
                {[40, 65, 55, 90, 70, 80, 50].map((h, i) => (
                  <div key={i} className="audio-bar animate-bar-1" style={{ height: `${h}%`, animationDelay: `${i*0.1}s` }} />
                ))}
              </div>
            </Card>

            {/* Transcript */}
            <div className="lg:col-span-2">
              <LiveInterviewDemo />
            </div>
          </div>
        </section>

        <div className="benz-divider" />

        {/* ── Section 3: Feedback Demo ── */}
        <section>
          <div className="flex items-start gap-4 mb-8">
            <div className="w-8 h-8 rounded-sm bg-benz-surface2 border border-benz-border flex items-center justify-center text-xs font-semibold text-benz-silver shrink-0">
              03
            </div>
            <div>
              <h2 className="text-xl font-light text-benz-chrome">Performance Report</h2>
              <p className="text-benz-muted text-sm mt-1">
                AI analyses your transcript and delivers scores, insights and action items.
              </p>
            </div>
          </div>

          <Card className="max-w-2xl mx-auto hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Interview Report</CardTitle>
                  <CardDescription>Software Engineer · 8 minutes · 8 exchanges</CardDescription>
                </div>
                <Badge variant="silver">Score: 7.5/10</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <FeedbackDemo />
            </CardContent>
          </Card>
        </section>

        <div className="benz-divider" />

        {/* ── CTA section ── */}
        <section className="text-center py-8">
          <h2 className="text-3xl font-light text-benz-chrome mb-4">
            Ready to practice?
          </h2>
          <p className="text-benz-muted mb-8">
            Upload your resume and start a real interview in under 60 seconds.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="xl" className="gap-3">
                <Mic size={18} />
                Start Interview Now
              </Button>
            </Link>
            <Link href="/">
              <Button size="xl" variant="ghost">
                Back to Home
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
