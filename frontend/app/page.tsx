'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Upload, ChevronRight, Mic, FileText, Star,
  Briefcase, Shield, Code2, Database, Brain, BarChart2,
  Zap, Settings, FlaskConical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { uploadResume, createSession } from '@/lib/api';
import ProtectedRoute from '@/components/protected-route';

const ROLES = [
  { id: 'Software Engineer',         icon: Code2,        label: 'Software Engineer' },
  { id: 'Frontend Engineer',         icon: Settings,     label: 'Frontend Engineer' },
  { id: 'Backend Engineer',          icon: Database,     label: 'Backend Engineer' },
  { id: 'Full Stack Engineer',       icon: Zap,          label: 'Full Stack' },
  { id: 'Data Scientist',            icon: BarChart2,    label: 'Data Scientist' },
  { id: 'Machine Learning Engineer', icon: Brain,        label: 'ML Engineer' },
  { id: 'DevOps Engineer',           icon: Settings,     label: 'DevOps' },
  { id: 'Cybersecurity Analyst',     icon: Shield,       label: 'Cybersecurity' },
  { id: 'Product Manager',           icon: Briefcase,    label: 'Product Manager' },
  { id: 'QA Engineer',               icon: FlaskConical, label: 'QA Engineer' },
];

function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-white/[0.04]">
      <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-benz-surface2 border border-benz-border flex items-center justify-center">
            <Star size={12} className="text-benz-silver" />
          </div>
          <span className="text-sm font-medium text-benz-silver">
            Interview<span className="text-benz-chrome">AI</span>
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {[
            { href: '/demo', label: 'Demo' },
            { href: '#how',  label: 'How it works' },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="px-3 py-1.5 text-xs text-benz-muted hover:text-benz-silver rounded-lg hover:bg-benz-surface transition-all duration-200"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/login">
          <Button variant="outline" size="sm">Sign in</Button>
        </Link>
      </div>
    </header>
  );
}

function AudioWave({ active }: { active: boolean }) {
  return (
    <div className={`flex items-end gap-[3px] h-7 ${active ? '' : 'opacity-25'}`}>
      {[40, 72, 55, 90, 62, 80, 48].map((h, i) => (
        <div
          key={i}
          className="audio-bar"
          style={{
            height: `${h}%`,
            animation: active ? `bar-wave 1.1s ${(i * 0.1).toFixed(1)}s ease-in-out infinite` : 'none',
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState('');
  const [drag, setDrag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const step = !file ? 1 : !role ? 2 : 3;

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f?.type === 'application/pdf') { setFile(f); setError(''); }
    else setError('Please drop a PDF file');
  }

  async function start() {
    if (!file || !role) return;
    setLoading(true);
    setError('');
    try {
      const { resumeId } = await uploadResume(file);
      const { sessionId } = await createSession(resumeId, role);
      router.push(`/interview?sessionId=${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="min-h-screen pt-[60px]">

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <section className="relative min-h-[calc(100vh-60px)] flex items-center overflow-hidden">
          <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(196,196,196,0.025) 1px,transparent 1px),' +
                'linear-gradient(90deg,rgba(196,196,196,0.025) 1px,transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />
          {/* side glow */}
          <div className="absolute -right-40 top-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-benz-silver/[0.04] blur-[90px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 py-20 w-full">
            <div className="grid lg:grid-cols-2 gap-14 items-center">

              {/* Copy */}
              <div>
                <Badge variant="silver" className="mb-7 animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-benz-silver animate-pulse" />
                  Powered by Gemini Live
                </Badge>

                <h1 className="text-[3.5rem] md:text-[4rem] font-light leading-[1.05] text-benz-chrome tracking-tightest animate-fade-in-delay text-balance">
                  Ace Your<br />
                  <span className="text-shimmer font-semibold">Next Interview.</span>
                </h1>

                <p className="mt-5 text-base text-benz-muted leading-relaxed max-w-[380px] animate-fade-in-delay2">
                  Practice with a live AI interviewer that knows your resume. Real questions.
                  Real voice. Real feedback.
                </p>

                <div className="flex items-center gap-5 mt-9 animate-fade-in-delay3">
                  <AudioWave active />
                  <span className="text-xs text-benz-muted tracking-wide">
                    Live voice interview
                  </span>
                </div>
              </div>

              {/* Setup card */}
              <div className="animate-fade-in-delay2">

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-7">
                  {[{ n: 1, l: 'Resume' }, { n: 2, l: 'Role' }, { n: 3, l: 'Start' }].map((s, i) => (
                    <div key={s.n} className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-300 ${
                            step > s.n
                              ? 'bg-benz-chrome text-benz-black'
                              : step === s.n
                              ? 'bg-transparent text-benz-chrome border border-benz-silver/50'
                              : 'bg-transparent text-benz-muted border border-benz-border'
                          }`}
                        >
                          {step > s.n ? '✓' : s.n}
                        </div>
                        <span className={`text-xs transition-colors ${step >= s.n ? 'text-benz-silver' : 'text-benz-muted'}`}>
                          {s.l}
                        </span>
                      </div>
                      {i < 2 && <div className="w-6 h-px bg-benz-border mx-0.5" />}
                    </div>
                  ))}
                </div>

                {/* Drop zone */}
                <div
                  className={`rounded-xl border-2 border-dashed p-7 text-center cursor-pointer transition-all duration-200 mb-3 ${
                    drag
                      ? 'border-benz-silver bg-benz-silver/[0.06]'
                      : file
                      ? 'border-emerald-500/40 bg-emerald-500/[0.04]'
                      : 'border-benz-border bg-benz-surface hover:border-benz-border-2 hover:bg-benz-surface2'
                  }`}
                  onDrop={onDrop}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onClick={() => document.getElementById('fi')?.click()}
                >
                  <input
                    id="fi" type="file" accept=".pdf" className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(''); } }}
                  />
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                        <FileText size={17} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-benz-chrome">{file.name}</p>
                        <p className="text-xs text-benz-muted mt-0.5">{(file.size / 1024).toFixed(0)} KB · PDF ready</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-benz-surface2 border border-benz-border mx-auto mb-3 flex items-center justify-center text-benz-muted">
                        <Upload size={19} />
                      </div>
                      <p className="text-sm text-benz-muted">
                        Drag & drop your resume, or <span className="text-benz-silver underline underline-offset-2">browse</span>
                      </p>
                      <p className="text-xs text-benz-muted/50 mt-1">PDF only · max 10 MB</p>
                    </>
                  )}
                </div>

                {/* Role grid */}
                <div className="grid grid-cols-2 gap-1.5 mb-4">
                  {ROLES.slice(0, 6).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => { setRole(id); setError(''); }}
                      className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-left text-xs font-medium transition-all duration-200 ${
                        role === id
                          ? 'bg-benz-silver/10 border-benz-silver/40 text-benz-chrome shadow-glow-silver'
                          : 'bg-benz-surface border-benz-border text-benz-muted hover:bg-benz-surface2 hover:border-benz-border-2 hover:text-benz-silver'
                      }`}
                    >
                      <Icon size={13} className="shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>

                {error && (
                  <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3.5 py-2.5 mb-3 text-center">
                    {error}
                  </p>
                )}

                <Button
                  size="lg"
                  className="w-full group"
                  onClick={start}
                  disabled={loading || !file || !role}
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-benz-black/25 border-t-benz-black animate-spin" />
                  ) : (
                    <>
                      <Mic size={15} />
                      Start Live Interview
                      <ChevronRight size={15} className="ml-auto group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────────── */}
        <section id="how" className="py-24 border-t border-benz-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-14">
              <p className="text-[0.65rem] tracking-[0.4em] uppercase text-benz-gold flex items-center justify-center gap-3 mb-4">
                <span className="w-8 h-px bg-benz-gold opacity-70" />
                The Process
                <span className="w-8 h-px bg-benz-gold opacity-70" />
              </p>
              <h2 className="text-3xl font-light text-benz-chrome tracking-tight">
                Four steps to interview mastery
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-4">
              {[
                { n: '01', icon: Upload,    title: 'Upload Resume',   desc: 'Drop your PDF. Our parser extracts and understands your background instantly.' },
                { n: '02', icon: Briefcase, title: 'Choose Role',     desc: 'Pick from 10+ roles. The AI adapts every question to your target position.' },
                { n: '03', icon: Mic,       title: 'Live Interview',  desc: 'Voice-to-voice conversation. Gemini Live asks, you answer — naturally.' },
                { n: '04', icon: BarChart2, title: 'Get Feedback',    desc: 'Scores, strengths, weaknesses, and actionable improvement suggestions.' },
              ].map(({ n, icon: Icon, title, desc }, i) => (
                <div
                  key={n}
                  className="group hover-lift p-6 rounded-xl bg-benz-surface border border-benz-border"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="w-9 h-9 rounded-lg bg-benz-surface2 border border-benz-border flex items-center justify-center text-benz-muted group-hover:text-benz-silver group-hover:border-benz-border-2 transition-colors">
                      <Icon size={16} />
                    </div>
                    <span className="text-[2rem] font-light text-benz-border group-hover:text-benz-surface3 transition-colors leading-none">
                      {n}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-benz-chrome mb-2">{title}</h3>
                  <p className="text-xs text-benz-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <footer className="border-t border-benz-border py-9">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Star size={12} className="text-benz-muted" />
              <span className="text-xs text-benz-muted">InterviewAI &copy; 2025</span>
            </div>
            <Link href="/demo">
              <Button variant="link" size="sm" className="text-benz-muted text-xs">
                Try the demo →
              </Button>
            </Link>
          </div>
        </footer>
      </main>
    </ProtectedRoute>
  );
}
