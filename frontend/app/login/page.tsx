'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Sparkles, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/* Three-pointed ring mark — Mercedes inspired */
function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="50" cy="50" r="46" stroke="url(#g1)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="36" stroke="url(#g1)" strokeWidth="0.6" opacity="0.35" />
      <path
        d="M50 10 L53.2 44 L85 55 L53.2 58 L50 90 L46.8 58 L15 55 L46.8 44 Z"
        fill="url(#g2)"
      />
      <defs>
        <linearGradient id="g1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#4A4A4A" />
          <stop offset="50%"  stopColor="#D4D4D4" />
          <stop offset="100%" stopColor="#4A4A4A" />
        </linearGradient>
        <linearGradient id="g2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#666" />
          <stop offset="50%"  stopColor="#E0E0E0" />
          <stop offset="100%" stopColor="#666" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password'); return; }
    setLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 900));
    router.push('/');
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Left: brand panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden bg-benz-dark">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.028]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(200,200,200,1) 1px,transparent 1px),' +
              'linear-gradient(90deg,rgba(200,200,200,1) 1px,transparent 1px)',
            backgroundSize: '72px 72px',
          }}
        />
        {/* Radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-benz-silver/[0.04] blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          {/* Logo row */}
          <div className="flex items-center gap-3 animate-fade-in">
            <BrandMark size={32} />
            <span className="text-[0.7rem] tracking-[0.28em] uppercase text-benz-muted">
              Interview<span className="text-benz-silver">AI</span>
            </span>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center max-w-xs animate-fade-in-delay">
            <p className="flex items-center gap-3 text-[0.65rem] tracking-[0.4em] uppercase text-benz-gold mb-8">
              <span className="inline-block w-10 h-px bg-benz-gold opacity-70" />
              Precision Training
            </p>

            <h1 className="text-[3.25rem] font-light leading-[1.08] text-benz-chrome tracking-tightest">
              The Best
              <br />
              <span className="text-shimmer font-semibold">Version</span>
              <br />
              of You.
            </h1>

            <p className="mt-7 text-sm text-benz-muted leading-relaxed max-w-[260px]">
              Real-time voice interviews powered by Gemini Live. Practise smarter, land the role
              you deserve.
            </p>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-delay2 border-t border-benz-border pt-8 grid grid-cols-3 gap-6">
            {[
              { n: '10K+', l: 'Interviews' },
              { n: '94%',  l: 'Success Rate' },
              { n: '50+',  l: 'Job Roles' },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-semibold text-benz-chrome">{s.n}</p>
                <p className="mt-1 text-[0.65rem] text-benz-muted uppercase tracking-[0.12em]">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Corner accent */}
        <div className="absolute bottom-0 right-0 w-48 h-48 border-b border-r border-benz-border/25" />
      </div>

      {/* ── Right: form ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 bg-benz-black">
        {/* Mobile logo */}
        <div className="absolute top-7 left-7 flex items-center gap-2 lg:hidden">
          <BrandMark size={26} />
          <span className="text-[0.65rem] tracking-[0.28em] uppercase text-benz-muted">InterviewAI</span>
        </div>

        <div className="w-full max-w-[360px] mx-auto">
          {/* Heading */}
          <div className="mb-9 animate-fade-in">
            <h2 className="text-[1.75rem] font-light text-benz-chrome tracking-tight">
              Welcome back
            </h2>
            <p className="mt-1.5 text-sm text-benz-muted">Sign in to continue your journey</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4 animate-fade-in-delay">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-[0.7rem] text-benz-muted hover:text-benz-silver transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  autoComplete="current-password"
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-benz-muted hover:text-benz-silver transition-colors p-0.5"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3.5 py-2.5">
                {error}
              </p>
            )}

            <Button
              type="submit"
              size="lg"
              className="w-full mt-1"
              disabled={loading}
            >
              {loading ? (
                <span className="w-4 h-4 rounded-full border-2 border-benz-black/25 border-t-benz-black animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6 animate-fade-in-delay2">
            <div className="flex-1 h-px bg-benz-border" />
            <span className="text-[0.65rem] text-benz-muted uppercase tracking-[0.15em]">or</span>
            <div className="flex-1 h-px bg-benz-border" />
          </div>

          {/* Alternatives */}
          <div className="space-y-2.5 animate-fade-in-delay2">
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => router.push('/')}
            >
              Continue as Guest
            </Button>

            <Button
              variant="ghost"
              size="lg"
              className="w-full border border-benz-gold/30 text-benz-gold-light hover:bg-benz-gold/10 hover:border-benz-gold/50"
              onClick={() => router.push('/demo')}
            >
              <Sparkles size={15} />
              Try Demo — No sign in
            </Button>
          </div>

          <p className="text-center text-xs text-benz-muted mt-8 animate-fade-in-delay3">
            No account?{' '}
            <Link href="/login" className="text-benz-silver hover:text-benz-chrome transition-colors underline underline-offset-2">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
