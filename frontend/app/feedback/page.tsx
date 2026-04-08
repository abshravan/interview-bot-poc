'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, TrendingUp, TrendingDown, Lightbulb, ArrowLeft,
  RotateCcw, CheckCircle, AlertCircle, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { getFeedback, getSession } from '@/lib/api';

interface Feedback {
  strengths: string[];
  weaknesses: string[];
  communicationScore: number;
  technicalScore: number;
  suggestions: string[];
}

/* ── Animated score ring ─────────────────────────────────────────────────── */
function ScoreRing({
  score,
  label,
  color = '#C8C8C8',
  delay = 0,
}: {
  score: number;
  label: string;
  color?: string;
  delay?: number;
}) {
  const [displayed, setDisplayed] = useState(0);
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ - (displayed / 10) * circ;

  useEffect(() => {
    const timer = setTimeout(() => {
      let n = 0;
      const id = setInterval(() => {
        n += 0.2;
        if (n >= score) { n = score; clearInterval(id); }
        setDisplayed(parseFloat(n.toFixed(1)));
      }, 30);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(timer);
  }, [score, delay]);

  const ringColor =
    score >= 8 ? '#4CAF89' :
    score >= 6 ? '#C8C8C8' :
    score >= 4 ? '#F59E0B' :
    '#EF4444';

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <svg width="110" height="110" viewBox="0 0 110 110">
          {/* Track */}
          <circle cx="55" cy="55" r={r} fill="none" stroke="#1E1E1E" strokeWidth="8" />
          {/* Progress */}
          <circle
            cx="55"
            cy="55"
            r={r}
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 55 55)"
            className="score-ring-progress"
            style={{ filter: `drop-shadow(0 0 6px ${ringColor}60)` }}
          />
          {/* Score number */}
          <text
            x="55"
            y="51"
            textAnchor="middle"
            fill="#E8E8E8"
            fontSize="22"
            fontWeight="600"
            fontFamily="system-ui"
          >
            {displayed.toFixed(0)}
          </text>
          <text
            x="55"
            y="66"
            textAnchor="middle"
            fill="#6B6B6B"
            fontSize="9"
            fontFamily="system-ui"
            letterSpacing="2"
          >
            /10
          </text>
        </svg>
      </div>
      <p className="text-xs text-benz-muted tracking-widest uppercase">{label}</p>
    </div>
  );
}

/* ── Grade pill ──────────────────────────────────────────────────────────── */
function grade(score: number) {
  if (score >= 9) return { label: 'Excellent', variant: 'success' as const };
  if (score >= 7) return { label: 'Good',      variant: 'silver' as const };
  if (score >= 5) return { label: 'Fair',       variant: 'warning' as const };
  return              { label: 'Needs Work',  variant: 'error' as const };
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function FeedbackPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get('sessionId');

  const [fb, setFb] = useState<Feedback | null>(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) { setError('No session ID'); setLoading(false); return; }
    Promise.all([getFeedback(sessionId), getSession(sessionId)])
      .then(([f, s]) => { setFb(f); setRole(s.role); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-benz-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full border border-benz-border mx-auto flex items-center justify-center animate-pulse-ring">
            <Star size={24} className="text-benz-silver" />
          </div>
          <p className="text-sm text-benz-muted">Analysing your performance...</p>
        </div>
      </div>
    );
  }

  if (error || !fb) {
    return (
      <div className="min-h-screen bg-benz-black flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <h2 className="text-xl text-benz-chrome">Something went wrong</h2>
          <p className="text-benz-muted text-sm">{error || 'No feedback available'}</p>
          <Button onClick={() => router.push('/')} variant="outline">Back to Home</Button>
        </div>
      </div>
    );
  }

  const overall = (fb.communicationScore + fb.technicalScore) / 2;
  const g = grade(overall);

  return (
    <div className="min-h-screen bg-benz-black">
      {/* Header */}
      <header className="glass border-b border-benz-border/50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-benz-muted hover:text-benz-silver transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-benz-border" />
          <Star size={14} className="text-benz-muted" />
          <span className="text-xs tracking-[0.2em] uppercase text-benz-silver">Performance Report</span>
        </div>
        {role && <Badge variant="silver">{role}</Badge>}
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* ── Hero score section ── */}
        <div className="text-center mb-12 animate-fade-in">
          <p className="text-xs tracking-[0.4em] uppercase text-benz-gold mb-4 flex items-center justify-center gap-2">
            <span className="inline-block w-6 h-px bg-benz-gold" />
            Interview Complete
            <span className="inline-block w-6 h-px bg-benz-gold" />
          </p>
          <h1 className="text-4xl font-light text-benz-chrome mb-2">
            Overall Score:{' '}
            <span className="text-shimmer font-semibold">{overall.toFixed(1)}</span>
            <span className="text-benz-muted text-2xl"> / 10</span>
          </h1>
          <div className="flex justify-center mt-3">
            <Badge variant={g.variant} className="text-sm px-4 py-1">{g.label}</Badge>
          </div>
        </div>

        {/* Score rings */}
        <div className="flex items-center justify-center gap-16 mb-12 animate-fade-in-delay">
          <ScoreRing score={fb.communicationScore} label="Communication" delay={200} />
          <div className="text-center">
            <div className="relative">
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="60" fill="none" stroke="#1E1E1E" strokeWidth="10" />
                <circle
                  cx="70"
                  cy="70"
                  r="60"
                  fill="none"
                  stroke="url(#overallGrad)"
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 - (overall / 10) * 2 * Math.PI * 60}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                  className="score-ring-progress"
                />
                <text x="70" y="65" textAnchor="middle" fill="#E8E8E8" fontSize="32" fontWeight="600" fontFamily="system-ui">
                  {overall.toFixed(0)}
                </text>
                <text x="70" y="84" textAnchor="middle" fill="#6B6B6B" fontSize="10" fontFamily="system-ui" letterSpacing="2">
                  OVERALL
                </text>
                <defs>
                  <linearGradient id="overallGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#888" />
                    <stop offset="50%" stopColor="#D4D4D4" />
                    <stop offset="100%" stopColor="#888" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <p className="text-xs text-benz-muted tracking-widest uppercase mt-1">Score</p>
          </div>
          <ScoreRing score={fb.technicalScore} label="Technical" delay={400} />
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-2 gap-4 mb-10 animate-fade-in-delay2">
          {[
            { label: 'Communication', score: fb.communicationScore },
            { label: 'Technical',     score: fb.technicalScore },
          ].map(({ label, score }) => (
            <Card key={label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-benz-muted uppercase tracking-widest">{label}</span>
                  <span className="text-sm font-semibold text-benz-chrome">{score}/10</span>
                </div>
                <Progress value={score * 10} className="h-1" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs: detailed breakdown */}
        <div className="animate-fade-in-delay2">
          <Tabs defaultValue="strengths">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="strengths">Strengths</TabsTrigger>
              <TabsTrigger value="weaknesses">Improve</TabsTrigger>
              <TabsTrigger value="suggestions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="strengths" className="space-y-3">
              {fb.strengths.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-sm bg-emerald-500/5 border border-emerald-500/20 hover-lift"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-benz-chrome leading-relaxed">{s}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="weaknesses" className="space-y-3">
              {fb.weaknesses.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-sm bg-amber-500/5 border border-amber-500/20 hover-lift"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <TrendingDown size={16} className="text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-benz-chrome leading-relaxed">{w}</p>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="suggestions" className="space-y-3">
              {fb.suggestions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-sm bg-benz-surface border border-benz-border hover-lift"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="w-6 h-6 rounded-sm bg-benz-surface2 border border-benz-border flex items-center justify-center text-xs text-benz-muted shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-sm text-benz-chrome leading-relaxed">{s}</p>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* CTA */}
        <div className="flex gap-4 mt-10 animate-fade-in-delay3">
          <Button variant="outline" className="flex-1" onClick={() => router.push('/')}>
            <RotateCcw size={14} /> Practice Again
          </Button>
          <Button className="flex-1" onClick={() => router.push('/demo')}>
            View Demo Report <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}
