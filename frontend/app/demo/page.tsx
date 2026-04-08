'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star, Mic, Send, CheckCircle, TrendingDown, FileText,
  ChevronRight, RotateCcw, Zap, Play, ArrowLeft, BarChart2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// ── Dummy data ───────────────────────────────────────────────────────────────
const TRANSCRIPT = [
  { role: 'interviewer', content: "Hi! I've reviewed your resume — impressive background. Let's start: walk me through your experience and what drew you to software engineering." },
  { role: 'candidate',   content: "Sure! Five years in full-stack development — started backend with Node.js, then moved into React. I love building scalable APIs alongside clean user interfaces." },
  { role: 'interviewer', content: "Your resume mentions a microservices migration. Walk me through the architecture and the trade-offs you made." },
  { role: 'candidate',   content: "We chose Kubernetes with a service mesh. The key trade-off was operational complexity vs scalability. We started by isolating user and payments services — highest impact areas." },
  { role: 'interviewer', content: "How did you handle inter-service communication — REST or event-driven?" },
  { role: 'candidate',   content: "REST for synchronous operations, Kafka for async events like order processing and notifications. It reduced coupling significantly." },
  { role: 'interviewer', content: "Good call. Last question — describe your approach to a production incident at 3 AM." },
  { role: 'candidate',   content: "I start with alerting dashboards and trace errors through our ELK stack. Isolate the failing service, check recent deploys, roll back if needed, then write a post-mortem." },
];

const FEEDBACK = {
  communicationScore: 8,
  technicalScore: 7,
  strengths: [
    'Clear, structured communication throughout',
    'Strong understanding of microservices architecture and trade-offs',
    'Systematic, calm approach to production incidents',
  ],
  weaknesses: [
    'Could quantify achievements more (e.g. latency reductions, uptime %)',
    'Missed deeper discussion of observability and distributed tracing',
  ],
  suggestions: [
    'Use STAR method and include specific metrics in every answer',
    'Prepare a deeper dive on system design: CAP theorem, eventual consistency',
    'Vary explanation depth — practice for both technical and non-technical audiences',
  ],
};

// ── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, label, delay = 0 }: { score: number; label: string; delay?: number }) {
  const [d, setD] = useState(0);
  const r = 34; const circ = 2 * Math.PI * r;
  const color = score >= 8 ? '#4ADE80' : score >= 6 ? '#C4C4C4' : '#FBBF24';

  useEffect(() => {
    const t = setTimeout(() => {
      let n = 0;
      const id = setInterval(() => { n += 0.25; if (n >= score) { n = score; clearInterval(id); } setD(n); }, 22);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="85" height="85" viewBox="0 0 85 85">
        <circle cx="42.5" cy="42.5" r={r} fill="none" stroke="#1A1A1A" strokeWidth="6" />
        <circle cx="42.5" cy="42.5" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={circ - (d/10)*circ}
          strokeLinecap="round" transform="rotate(-90 42.5 42.5)"
          className="score-ring-progress"
          style={{ filter: `drop-shadow(0 0 4px ${color}55)` }} />
        <text x="42.5" y="40" textAnchor="middle" fill="#E8E8E8" fontSize="17" fontWeight="600" fontFamily="var(--font-inter),system-ui">{d.toFixed(0)}</text>
        <text x="42.5" y="53" textAnchor="middle" fill="#636363" fontSize="7.5" fontFamily="var(--font-inter),system-ui" letterSpacing="1">/10</text>
      </svg>
      <p className="text-[0.6rem] text-benz-muted uppercase tracking-[0.12em]">{label}</p>
    </div>
  );
}

// ── Live interview demo ──────────────────────────────────────────────────────
function LiveInterviewDemo() {
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const [typing, setTyping] = useState(false);
  const visible = TRANSCRIPT.slice(0, step);

  function startDemo() {
    setRunning(true); setStep(0);
    let s = 0;
    const run = () => {
      if (s >= TRANSCRIPT.length) { setRunning(false); return; }
      setTyping(true);
      setTimeout(() => { s++; setStep(s); setTyping(false); setTimeout(run, 1600); }, 900);
    };
    setTimeout(run, 400);
  }

  return (
    <div className="rounded-xl border border-benz-border overflow-hidden">
      <div className="flex items-center justify-between px-4 h-11 bg-benz-dark border-b border-benz-border">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[0.65rem] text-benz-muted uppercase tracking-wide">Live demo</span>
        </div>
        <div className="flex gap-2">
          {!running && step < TRANSCRIPT.length && (
            <Button size="sm" variant="outline" onClick={startDemo} className="h-7 text-xs">
              <Play size={10} /> Auto-play
            </Button>
          )}
          {(running || step > 0) && (
            <Button size="sm" variant="ghost" onClick={() => { setStep(0); setRunning(false); }} className="h-7 text-xs">
              <RotateCcw size={10} />
            </Button>
          )}
        </div>
      </div>

      <div className="bg-benz-dark h-72 overflow-y-auto p-4 space-y-3 no-scrollbar">
        {visible.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-3 opacity-50">
            <div className="w-10 h-10 rounded-full bg-benz-surface border border-benz-border flex items-center justify-center animate-float">
              <Mic size={16} className="text-benz-muted" />
            </div>
            <p className="text-xs text-benz-muted">Press Auto-play to watch a mock interview</p>
          </div>
        )}
        {visible.map((m, i) => (
          <div key={i} className={`flex gap-2 animate-fade-in ${m.role === 'candidate' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-semibold border shrink-0 ${
              m.role === 'interviewer'
                ? 'bg-benz-surface2 border-benz-silver/20 text-benz-silver'
                : 'bg-benz-chrome/[0.08] border-benz-chrome/20 text-benz-chrome'
            }`}>
              {m.role === 'interviewer' ? 'AI' : 'Me'}
            </div>
            <div className={`max-w-[80%] px-3 py-2 text-xs leading-relaxed ${
              m.role === 'interviewer'
                ? 'bg-benz-surface border border-benz-border text-benz-chrome rounded-2xl rounded-tl-sm'
                : 'bg-benz-silver/[0.07] border border-benz-silver/12 text-benz-chrome rounded-2xl rounded-tr-sm'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex gap-2 animate-fade-in">
            <div className="w-6 h-6 rounded-lg bg-benz-surface2 border border-benz-silver/20 flex items-center justify-center text-[10px] text-benz-silver shrink-0">
              {TRANSCRIPT[step]?.role === 'candidate' ? 'Me' : 'AI'}
            </div>
            <div className="px-3 py-2.5 bg-benz-surface border border-benz-border rounded-2xl rounded-tl-sm flex gap-1">
              {[0,1,2].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-benz-silver/40 animate-bounce" style={{ animationDelay: `${d*0.13}s` }} />)}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-benz-border p-2.5 flex gap-2 bg-benz-dark">
        <input className="flex-1 h-8 bg-benz-surface border border-benz-border rounded-lg px-3 text-xs text-benz-chrome placeholder:text-benz-muted/50 cursor-not-allowed" placeholder="Speak or type…" readOnly />
        <button className="w-8 h-8 rounded-lg bg-benz-chrome/30 flex items-center justify-center cursor-not-allowed">
          <Send size={12} className="text-benz-muted" />
        </button>
      </div>
    </div>
  );
}

// ── Feedback demo ────────────────────────────────────────────────────────────
function FeedbackDemo() {
  const overall = (FEEDBACK.communicationScore + FEEDBACK.technicalScore) / 2;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-around py-2">
        <ScoreRing score={FEEDBACK.communicationScore} label="Communication" delay={100} />
        <div className="text-center">
          <p className="text-4xl font-light text-benz-chrome">{overall.toFixed(1)}</p>
          <p className="text-[0.6rem] text-benz-muted uppercase tracking-[0.12em] mt-1">Overall</p>
          <Badge variant="silver" className="mt-2 text-[0.6rem]">Good</Badge>
        </div>
        <ScoreRing score={FEEDBACK.technicalScore} label="Technical" delay={300} />
      </div>

      <Separator />

      <div className="space-y-2.5">
        {[
          { label: 'Communication', v: FEEDBACK.communicationScore },
          { label: 'Technical',     v: FEEDBACK.technicalScore },
        ].map(({ label, v }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-benz-muted">{label}</span>
              <span className="text-benz-chrome font-medium">{v}/10</span>
            </div>
            <Progress value={v * 10} />
          </div>
        ))}
      </div>

      <Separator />

      <Tabs defaultValue="s">
        <TabsList className="w-full">
          <TabsTrigger value="s">Strengths</TabsTrigger>
          <TabsTrigger value="w">Improve</TabsTrigger>
          <TabsTrigger value="a">Actions</TabsTrigger>
        </TabsList>
        <TabsContent value="s" className="space-y-2">
          {FEEDBACK.strengths.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15">
              <CheckCircle size={13} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-benz-chrome leading-relaxed">{s}</p>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="w" className="space-y-2">
          {FEEDBACK.weaknesses.map((w, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/[0.05] border border-amber-500/15">
              <TrendingDown size={13} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-benz-chrome leading-relaxed">{w}</p>
            </div>
          ))}
        </TabsContent>
        <TabsContent value="a" className="space-y-2">
          {FEEDBACK.suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl bg-benz-surface border border-benz-border">
              <div className="w-4 h-4 rounded-full bg-benz-surface2 border border-benz-border flex items-center justify-center text-[9px] font-semibold text-benz-muted shrink-0">{i+1}</div>
              <p className="text-xs text-benz-chrome leading-relaxed">{s}</p>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────
export default function DemoPage() {
  return (
    <div className="min-h-screen bg-benz-black">
      {/* Header */}
      <header className="glass border-b border-white/[0.04] px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-benz-muted hover:text-benz-silver transition-colors p-1 -ml-1">
            <ArrowLeft size={17} />
          </Link>
          <div className="h-3.5 w-px bg-benz-border" />
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-benz-surface2 border border-benz-border flex items-center justify-center">
              <Star size={11} className="text-benz-silver" />
            </div>
            <span className="text-xs font-medium text-benz-silver">
              Interview<span className="text-benz-chrome">AI</span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <Badge variant="gold"><Zap size={9} />Demo</Badge>
          <Link href="/login">
            <Button size="sm">Get Started <ChevronRight size={12} /></Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative py-20 text-center overflow-hidden border-b border-benz-border">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="max-w-xl mx-auto px-6 relative">
          <Badge variant="silver" className="mb-5 mx-auto"><span className="w-1.5 h-1.5 rounded-full bg-benz-silver animate-pulse" /> Interactive Preview</Badge>
          <h1 className="text-4xl font-light text-benz-chrome tracking-tight mb-4 animate-fade-in">
            See It In Action
          </h1>
          <p className="text-benz-muted animate-fade-in-delay leading-relaxed">
            Complete mock session — upload to live conversation to detailed feedback.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8 animate-fade-in-delay2">
            <Link href="/login">
              <Button size="lg" className="gap-2"><Mic size={15} /> Start Your Interview</Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="ghost">Learn More</Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-5 py-14 space-y-16">

        {/* ── 01 Upload ── */}
        <section>
          <div className="flex items-start gap-4 mb-7">
            <div className="w-7 h-7 rounded-full bg-benz-surface border border-benz-border flex items-center justify-center text-[11px] font-semibold text-benz-silver shrink-0">1</div>
            <div>
              <h2 className="text-lg font-light text-benz-chrome">Upload Your Resume</h2>
              <p className="text-sm text-benz-muted mt-0.5">PDF parsed instantly — text extracted, stored, and used to tailor every question.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="hover-lift">
              <CardContent className="p-5">
                <div className="rounded-xl border-2 border-dashed border-emerald-500/35 bg-emerald-500/[0.04] p-7 text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 mx-auto mb-3 flex items-center justify-center text-emerald-400">
                    <FileText size={20} />
                  </div>
                  <p className="text-sm font-medium text-benz-chrome">john_doe_resume.pdf</p>
                  <p className="text-xs text-emerald-400 mt-1">124 KB · Parsed successfully</p>
                </div>
                <div className="mt-4 p-3 rounded-xl bg-benz-surface2 border border-benz-border">
                  <p className="text-[0.65rem] text-benz-muted uppercase tracking-[0.1em] mb-1.5">Extracted preview</p>
                  <p className="text-xs text-benz-chrome leading-relaxed line-clamp-3">
                    John Doe · Senior Software Engineer · 5 years · Node.js, React, PostgreSQL, Kubernetes · Led monolith → microservices migration…
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover-lift">
              <CardHeader>
                <CardTitle>Role Selected</CardTitle>
                <CardDescription>Interview tailored to your target position</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-1.5">
                  {['Software Engineer','Backend Engineer','Full Stack','DevOps','Data Scientist','ML Engineer'].map((r, i) => (
                    <div key={r} className={`px-3 py-2 rounded-xl border text-xs font-medium ${
                      i === 0
                        ? 'bg-benz-silver/10 border-benz-silver/35 text-benz-chrome'
                        : 'bg-benz-surface border-benz-border text-benz-muted'
                    }`}>{r}</div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <div className="benz-divider" />

        {/* ── 02 Interview ── */}
        <section>
          <div className="flex items-start gap-4 mb-7">
            <div className="w-7 h-7 rounded-full bg-benz-surface border border-benz-border flex items-center justify-center text-[11px] font-semibold text-benz-silver shrink-0">2</div>
            <div>
              <h2 className="text-lg font-light text-benz-chrome">Live Voice Interview</h2>
              <p className="text-sm text-benz-muted mt-0.5">Real-time conversation with Gemini Live — asks follow-up questions based on your answers.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            <Card className="flex flex-col items-center justify-center py-10 px-6 gap-6">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border border-benz-silver/15 animate-pulse-ring" />
                <div className="w-18 h-18 w-[72px] h-[72px] rounded-full bg-benz-surface border border-benz-silver/25 shadow-glow-silver flex items-center justify-center">
                  <Star size={24} className="text-benz-chrome" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-benz-chrome">AI Interviewer</p>
                <p className="text-[0.65rem] text-benz-muted uppercase tracking-wide mt-1">Speaking</p>
              </div>
              <div className="flex items-end gap-[3px] h-8">
                {[40,68,52,88,65,78,45].map((h,i) => (
                  <div key={i} className="audio-bar animate-bar-1" style={{ height:`${h}%`, animationDelay:`${i*0.1}s` }} />
                ))}
              </div>
            </Card>

            <div className="lg:col-span-2">
              <LiveInterviewDemo />
            </div>
          </div>
        </section>

        <div className="benz-divider" />

        {/* ── 03 Feedback ── */}
        <section>
          <div className="flex items-start gap-4 mb-7">
            <div className="w-7 h-7 rounded-full bg-benz-surface border border-benz-border flex items-center justify-center text-[11px] font-semibold text-benz-silver shrink-0">3</div>
            <div>
              <h2 className="text-lg font-light text-benz-chrome">Performance Report</h2>
              <p className="text-sm text-benz-muted mt-0.5">Gemini analyses your transcript and delivers scores, insights, and action items.</p>
            </div>
          </div>

          <Card className="max-w-xl mx-auto hover-lift">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>Interview Report</CardTitle>
                  <CardDescription>Software Engineer · 8 min · 8 exchanges</CardDescription>
                </div>
                <Badge variant="silver">7.5 / 10</Badge>
              </div>
            </CardHeader>
            <CardContent><FeedbackDemo /></CardContent>
          </Card>
        </section>

        <div className="benz-divider" />

        {/* ── CTA ── */}
        <section className="text-center py-6">
          <h2 className="text-2xl font-light text-benz-chrome mb-3">Ready to practice?</h2>
          <p className="text-sm text-benz-muted mb-8">Upload your resume and start a real interview in under 60 seconds.</p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/login">
              <Button size="xl" className="gap-2"><Mic size={17} /> Start Interview Now</Button>
            </Link>
            <Link href="/"><Button size="xl" variant="ghost">Back to Home</Button></Link>
          </div>
        </section>
      </div>
    </div>
  );
}
