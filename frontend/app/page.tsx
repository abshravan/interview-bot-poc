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

// ── Role definitions ────────────────────────────────────────────────────────
const ROLES = [
  { id: 'Software Engineer',       icon: Code2,        label: 'Software Engineer' },
  { id: 'Frontend Engineer',       icon: Settings,     label: 'Frontend Engineer' },
  { id: 'Backend Engineer',        icon: Database,     label: 'Backend Engineer' },
  { id: 'Full Stack Engineer',     icon: Zap,          label: 'Full Stack' },
  { id: 'Data Scientist',          icon: BarChart2,    label: 'Data Scientist' },
  { id: 'Machine Learning Engineer', icon: Brain,      label: 'ML Engineer' },
  { id: 'DevOps Engineer',         icon: Settings,     label: 'DevOps' },
  { id: 'Cybersecurity Analyst',   icon: Shield,       label: 'Cybersecurity' },
  { id: 'Product Manager',         icon: Briefcase,    label: 'Product Manager' },
  { id: 'QA Engineer',             icon: FlaskConical, label: 'QA Engineer' },
];

// ── Nav ──────────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 glass border-b border-benz-border/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-sm bg-benz-surface2 border border-benz-border flex items-center justify-center">
            <Star size={14} className="text-benz-silver" />
          </div>
          <span className="text-sm tracking-[0.2em] uppercase text-benz-silver font-medium">
            Interview<span className="text-benz-chrome font-semibold">AI</span>
          </span>
        </div>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: '/demo',  label: 'Demo' },
            { href: '#how',   label: 'How It Works' },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="text-xs tracking-widest uppercase text-benz-muted hover:text-benz-silver transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <Link href="/login">
          <Button variant="outline" size="sm">Sign In</Button>
        </Link>
      </div>
    </header>
  );
}

// ── AudioWave decoration ─────────────────────────────────────────────────────
function AudioWave({ active }: { active: boolean }) {
  return (
    <div className={`flex items-end gap-[3px] h-8 ${active ? '' : 'opacity-30'}`}>
      {[1, 2, 3, 4, 5, 6, 7].map((_, i) => (
        <div
          key={i}
          className={`audio-bar ${active ? `animate-bar-${Math.min(i + 1, 5)}` : ''}`}
          style={{ height: `${[40, 70, 55, 90, 60, 75, 45][i]}%` }}
        />
      ))}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
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
    <>
      <Navbar />

      <main className="min-h-screen pt-16">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden min-h-[92vh] flex items-center">
          {/* Background effects */}
          <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(rgba(200,200,200,1) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,200,1) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
          {/* Side glow */}
          <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-benz-silver/5 blur-[80px] pointer-events-none" />

          <div className="max-w-6xl mx-auto px-6 py-24 w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left: copy */}
              <div>
                <Badge variant="silver" className="mb-8 animate-fade-in gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-benz-silver animate-pulse" />
                  Powered by Gemini Live
                </Badge>

                <h1 className="text-5xl md:text-6xl font-light leading-[1.1] text-benz-chrome animate-fade-in-delay">
                  Ace Your
                  <br />
                  <span className="text-shimmer font-semibold">Next Interview.</span>
                </h1>

                <p className="text-benz-muted text-lg leading-relaxed mt-6 max-w-md animate-fade-in-delay2">
                  Practice with a live AI interviewer that knows your resume.
                  Real questions. Real voice. Real feedback.
                </p>

                <div className="flex items-center gap-6 mt-10 animate-fade-in-delay3">
                  <AudioWave active={true} />
                  <span className="text-xs text-benz-muted tracking-widest uppercase">
                    Live voice interview
                  </span>
                </div>
              </div>

              {/* Right: interactive setup card */}
              <div className="animate-fade-in-delay2">
                {/* Progress steps */}
                <div className="flex items-center gap-3 mb-8">
                  {[
                    { n: 1, label: 'Resume' },
                    { n: 2, label: 'Role' },
                    { n: 3, label: 'Start' },
                  ].map((s, i) => (
                    <div key={s.n} className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-sm flex items-center justify-center text-xs font-semibold transition-all duration-300 ${
                            step > s.n
                              ? 'bg-benz-chrome text-benz-black'
                              : step === s.n
                              ? 'bg-benz-silver/20 text-benz-chrome border border-benz-silver/50'
                              : 'bg-benz-surface2 text-benz-muted border border-benz-border'
                          }`}
                        >
                          {step > s.n ? '✓' : s.n}
                        </div>
                        <span
                          className={`text-xs tracking-widest uppercase transition-colors ${
                            step >= s.n ? 'text-benz-silver' : 'text-benz-muted'
                          }`}
                        >
                          {s.label}
                        </span>
                      </div>
                      {i < 2 && <div className="w-8 h-px bg-benz-border" />}
                    </div>
                  ))}
                </div>

                {/* Upload zone */}
                <div
                  className={`relative rounded-sm border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 mb-4 ${
                    drag
                      ? 'border-benz-silver bg-benz-silver/10'
                      : file
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-benz-border bg-benz-surface hover:border-benz-silver/40 hover:bg-benz-surface2'
                  }`}
                  onDrop={onDrop}
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onClick={() => document.getElementById('fi')?.click()}
                >
                  <input
                    id="fi"
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) { setFile(f); setError(''); }
                    }}
                  />

                  {file ? (
                    <div className="flex items-center justify-center gap-3 text-emerald-400">
                      <div className="w-10 h-10 rounded-sm bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-benz-chrome">{file.name}</p>
                        <p className="text-xs text-benz-muted mt-0.5">
                          {(file.size / 1024).toFixed(0)} KB · PDF
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-sm bg-benz-surface2 border border-benz-border mx-auto mb-4 flex items-center justify-center text-benz-muted">
                        <Upload size={22} />
                      </div>
                      <p className="text-sm text-benz-muted">
                        Drag & drop your resume, or{' '}
                        <span className="text-benz-silver underline">browse</span>
                      </p>
                      <p className="text-xs text-benz-muted/60 mt-1">PDF only · max 10 MB</p>
                    </>
                  )}
                </div>

                {/* Role grid */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  {ROLES.slice(0, 6).map(({ id, icon: Icon, label }) => (
                    <button
                      key={id}
                      onClick={() => { setRole(id); setError(''); }}
                      className={`flex items-center gap-2.5 px-4 py-3 rounded-sm border text-left text-xs tracking-wide transition-all duration-200 ${
                        role === id
                          ? 'bg-benz-silver/15 border-benz-silver/60 text-benz-chrome shadow-silver-glow'
                          : 'bg-benz-surface border-benz-border text-benz-muted hover:bg-benz-surface2 hover:border-benz-silver/30 hover:text-benz-silver'
                      }`}
                    >
                      <Icon size={14} className="shrink-0" />
                      {label}
                    </button>
                  ))}
                </div>

                {/* More roles dropdown hint */}
                <p className="text-xs text-benz-muted text-center mb-5">
                  +4 more roles available after upload
                </p>

                {error && (
                  <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2 mb-4 text-center">
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
                    <span className="inline-block w-4 h-4 border-2 border-benz-black/30 border-t-benz-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Mic size={16} />
                      Start Live Interview
                      <ChevronRight
                        size={16}
                        className="ml-auto group-hover:translate-x-1 transition-transform"
                      />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="py-24 border-t border-benz-border">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-xs tracking-[0.4em] uppercase text-benz-gold mb-4 flex items-center justify-center gap-2">
                <span className="inline-block w-6 h-px bg-benz-gold" />
                The Process
                <span className="inline-block w-6 h-px bg-benz-gold" />
              </p>
              <h2 className="text-3xl font-light text-benz-chrome">
                Four steps to interview mastery
              </h2>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  n: '01',
                  icon: Upload,
                  title: 'Upload Resume',
                  desc: 'Drop your PDF. Our parser extracts and understands your experience.',
                },
                {
                  n: '02',
                  icon: Briefcase,
                  title: 'Choose Role',
                  desc: 'Select from 10+ job categories. The AI adapts its questions accordingly.',
                },
                {
                  n: '03',
                  icon: Mic,
                  title: 'Live Interview',
                  desc: 'Voice-to-voice conversation. Gemini Live asks, you answer — naturally.',
                },
                {
                  n: '04',
                  icon: BarChart2,
                  title: 'Get Feedback',
                  desc: 'Scores, strengths, weaknesses, and actionable suggestions.',
                },
              ].map(({ n, icon: Icon, title, desc }, i) => (
                <div
                  key={n}
                  className="group hover-lift p-6 rounded-sm bg-benz-surface border border-benz-border"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-sm bg-benz-surface2 border border-benz-border flex items-center justify-center text-benz-silver group-hover:border-benz-silver/50 transition-colors">
                      <Icon size={18} />
                    </div>
                    <span className="text-3xl font-light text-benz-border group-hover:text-benz-surface2 transition-colors">
                      {n}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-benz-chrome tracking-wide mb-2">{title}</h3>
                  <p className="text-xs text-benz-muted leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="border-t border-benz-border py-10">
          <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Star size={14} className="text-benz-muted" />
              <span className="text-xs text-benz-muted tracking-widest uppercase">
                InterviewAI &copy; 2025
              </span>
            </div>
            <Link href="/demo">
              <Button variant="link" size="sm" className="text-benz-muted text-xs">
                Try the demo →
              </Button>
            </Link>
          </div>
        </footer>
      </main>
    </>
  );
}
