'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Star, CheckCircle, TrendingDown, ArrowLeft, RotateCcw, AlertCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { getFeedback, getSession } from '@/lib/api';
import ProtectedRoute from '@/components/protected-route';

interface Feedback {
  strengths: string[];
  weaknesses: string[];
  communicationScore: number;
  technicalScore: number;
  suggestions: string[];
}

/* ── Animated score ring ──────────────────────────────────────────────────── */
function ScoreRing({ score, label, delay = 0 }: { score: number; label: string; delay?: number }) {
  const [d, setD] = useState(0);
  const r = 40; const circ = 2 * Math.PI * r;
  const color = score >= 8 ? '#4ADE80' : score >= 6 ? '#C4C4C4' : score >= 4 ? '#FBBF24' : '#F87171';

  useEffect(() => {
    const t = setTimeout(() => {
      let n = 0;
      const id = setInterval(() => {
        n += 0.18; if (n >= score) { n = score; clearInterval(id); }
        setD(n);
      }, 25);
    }, delay);
    return () => clearTimeout(t);
  }, [score, delay]);

  return (
    <div className="flex flex-col items-center gap-2.5">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* Track */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="#1A1A1A" strokeWidth="7" />
        {/* Progress */}
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke={color} strokeWidth="7"
          strokeDasharray={circ}
          strokeDashoffset={circ - (d / 10) * circ}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="score-ring-progress"
          style={{ filter: `drop-shadow(0 0 5px ${color}55)` }}
        />
        <text x="50" y="47" textAnchor="middle" fill="#E8E8E8" fontSize="20" fontWeight="600" fontFamily="var(--font-inter),system-ui">
          {d.toFixed(0)}
        </text>
        <text x="50" y="61" textAnchor="middle" fill="#636363" fontSize="8.5" fontFamily="var(--font-inter),system-ui" letterSpacing="1.5">
          /10
        </text>
      </svg>
      <p className="text-[0.65rem] text-benz-muted uppercase tracking-[0.12em]">{label}</p>
    </div>
  );
}

function grade(s: number) {
  if (s >= 9) return { label: 'Excellent', variant: 'success'  as const };
  if (s >= 7) return { label: 'Good',      variant: 'silver'   as const };
  if (s >= 5) return { label: 'Fair',      variant: 'warning'  as const };
  return           { label: 'Needs Work', variant: 'error'    as const };
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default function FeedbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get('sessionId');
  const [fb, setFb]       = useState<Feedback | null>(null);
  const [role, setRole]   = useState('');
  const [loading, setLd]  = useState(true);
  const [error, setErr]   = useState('');

  useEffect(() => {
    if (!sessionId) { setErr('No session ID'); setLd(false); return; }
    Promise.all([getFeedback(sessionId), getSession(sessionId)])
      .then(([f, s]) => { setFb(f); setRole(s.role); })
      .catch((e) => setErr(e.message))
      .finally(() => setLd(false));
  }, [sessionId]);

  if (loading) return (
    <div className="min-h-screen bg-benz-black flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-14 h-14 rounded-full border border-benz-border mx-auto flex items-center justify-center animate-pulse-ring">
          <Star size={22} className="text-benz-silver" />
        </div>
        <p className="text-sm text-benz-muted">Analysing your performance…</p>
      </div>
    </div>
  );

  if (error || !fb) return (
    <div className="min-h-screen bg-benz-black flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm px-6">
        <AlertCircle size={36} className="text-red-400 mx-auto" />
        <h2 className="text-lg text-benz-chrome">Something went wrong</h2>
        <p className="text-sm text-benz-muted">{error || 'No feedback available'}</p>
        <Button variant="outline" onClick={() => router.push('/')}>Back to Home</Button>
      </div>
    </div>
  );

  const overall = (fb.communicationScore + fb.technicalScore) / 2;
  const g = grade(overall);

  return (
    <ProtectedRoute>
    <div className="min-h-screen bg-benz-black">
      {/* Header */}
      <header className="glass border-b border-white/[0.04] px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-benz-muted hover:text-benz-silver transition-colors p-1 -ml-1">
            <ArrowLeft size={17} />
          </button>
          <div className="h-3.5 w-px bg-benz-border" />
          <span className="text-xs font-medium text-benz-silver">Performance Report</span>
        </div>
        {role && <Badge variant="silver">{role}</Badge>}
      </header>

      <div className="max-w-2xl mx-auto px-5 py-12 space-y-8">

        {/* Title */}
        <div className="text-center animate-fade-in">
          <p className="text-[0.65rem] tracking-[0.4em] uppercase text-benz-gold flex items-center justify-center gap-3 mb-4">
            <span className="w-8 h-px bg-benz-gold opacity-70" />
            Interview Complete
            <span className="w-8 h-px bg-benz-gold opacity-70" />
          </p>
          <h1 className="text-[2.5rem] font-light text-benz-chrome tracking-tight">
            Overall{' '}
            <span className="text-shimmer font-semibold">{overall.toFixed(1)}</span>
            <span className="text-benz-muted text-2xl"> / 10</span>
          </h1>
          <div className="flex justify-center mt-3">
            <Badge variant={g.variant}>{g.label}</Badge>
          </div>
        </div>

        {/* Score rings */}
        <Card className="animate-fade-in-delay">
          <CardContent className="py-8">
            <div className="flex items-center justify-around">
              <ScoreRing score={fb.communicationScore} label="Communication" delay={200} />

              {/* Centre overall */}
              <div className="text-center">
                <svg width="130" height="130" viewBox="0 0 130 130">
                  <circle cx="65" cy="65" r="56" fill="none" stroke="#1A1A1A" strokeWidth="9" />
                  <circle cx="65" cy="65" r="56" fill="none" stroke="url(#ov)" strokeWidth="9"
                    strokeDasharray={2*Math.PI*56}
                    strokeDashoffset={2*Math.PI*56 - (overall/10)*2*Math.PI*56}
                    strokeLinecap="round" transform="rotate(-90 65 65)"
                    className="score-ring-progress" />
                  <text x="65" y="61" textAnchor="middle" fill="#E8E8E8" fontSize="30" fontWeight="600" fontFamily="var(--font-inter),system-ui">
                    {overall.toFixed(0)}
                  </text>
                  <text x="65" y="79" textAnchor="middle" fill="#636363" fontSize="9.5" fontFamily="var(--font-inter),system-ui" letterSpacing="2">
                    OVERALL
                  </text>
                  <defs>
                    <linearGradient id="ov" x1="0" y1="0" x2="130" y2="0" gradientUnits="userSpaceOnUse">
                      <stop offset="0%"   stopColor="#555" />
                      <stop offset="50%"  stopColor="#C8C8C8" />
                      <stop offset="100%" stopColor="#555" />
                    </linearGradient>
                  </defs>
                </svg>
                <p className="text-[0.65rem] text-benz-muted uppercase tracking-[0.12em] -mt-1">Score</p>
              </div>

              <ScoreRing score={fb.technicalScore} label="Technical" delay={400} />
            </div>
          </CardContent>
        </Card>

        {/* Progress bars */}
        <div className="grid grid-cols-2 gap-3 animate-fade-in-delay2">
          {[
            { label: 'Communication', score: fb.communicationScore },
            { label: 'Technical',     score: fb.technicalScore },
          ].map(({ label, score }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="flex justify-between mb-3">
                  <span className="text-[0.65rem] text-benz-muted uppercase tracking-[0.1em]">{label}</span>
                  <span className="text-sm font-semibold text-benz-chrome">{score}/10</span>
                </div>
                <Progress value={score * 10} />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabbed breakdown */}
        <div className="animate-fade-in-delay2">
          <Tabs defaultValue="strengths">
            <TabsList className="w-full">
              <TabsTrigger value="strengths">Strengths</TabsTrigger>
              <TabsTrigger value="weaknesses">Improve</TabsTrigger>
              <TabsTrigger value="suggestions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="strengths" className="space-y-2">
              {fb.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/15 hover-lift">
                  <CheckCircle size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-benz-chrome leading-relaxed">{s}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="weaknesses" className="space-y-2">
              {fb.weaknesses.map((w, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/15 hover-lift">
                  <TrendingDown size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-benz-chrome leading-relaxed">{w}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-2">
              {fb.suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-benz-surface border border-benz-border hover-lift">
                  <div className="w-5 h-5 rounded-full bg-benz-surface2 border border-benz-border flex items-center justify-center text-[10px] font-semibold text-benz-muted shrink-0">{i+1}</div>
                  <p className="text-sm text-benz-chrome leading-relaxed">{s}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* CTAs */}
        <div className="flex gap-3 animate-fade-in-delay3">
          <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
            <RotateCcw size={14} /> Practice Again
          </Button>
          <Button className="flex-1" onClick={() => router.push('/demo')}>
            View Demo <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
}
