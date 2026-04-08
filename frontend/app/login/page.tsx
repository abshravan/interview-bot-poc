'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

/* Mercedes-inspired three-pointed star SVG */
function StarMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="46" stroke="url(#silverRing)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="38" stroke="url(#silverRing)" strokeWidth="0.5" opacity="0.4" />
      {/* Three-pointed star */}
      <path
        d="M50 8 L54 44 L88 52 L54 56 L50 92 L46 56 L12 52 L46 44 Z"
        fill="url(#starFill)"
        opacity="0.9"
      />
      <defs>
        <linearGradient id="silverRing" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#666" />
          <stop offset="50%" stopColor="#E8E8E8" />
          <stop offset="100%" stopColor="#666" />
        </linearGradient>
        <linearGradient id="starFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#888" />
          <stop offset="50%" stopColor="#D4D4D4" />
          <stop offset="100%" stopColor="#888" />
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
    if (!email || !password) { setError('Please enter your credentials'); return; }
    setLoading(true);
    setError('');
    // Simulate auth — replace with real API call
    await new Promise((r) => setTimeout(r, 1000));
    router.push('/');
  }

  function handleGuest() {
    router.push('/');
  }

  function handleDemo() {
    router.push('/demo');
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left panel: Brand hero ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col">
        {/* Dark gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-benz-dark via-benz-black to-[#080808]" />

        {/* Subtle grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(200,200,200,1) 1px, transparent 1px), linear-gradient(90deg, rgba(200,200,200,1) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
          }}
        />

        {/* Glow orb */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-benz-silver/5 blur-[120px]" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in">
            <StarMark size={36} />
            <span className="text-sm tracking-[0.3em] uppercase text-benz-muted font-light">
              Interview AI
            </span>
          </div>

          {/* Hero text */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="animate-fade-in-delay">
              <p className="text-xs tracking-[0.4em] uppercase text-benz-gold mb-6 flex items-center gap-2">
                <span className="inline-block w-8 h-px bg-benz-gold" />
                Precision Interview Training
              </p>
              <h1 className="text-5xl font-light leading-tight text-benz-chrome mb-4">
                The Best
                <br />
                <span className="text-shimmer font-semibold">Version</span>
                <br />
                of You.
              </h1>
              <p className="text-benz-muted text-base leading-relaxed max-w-xs mt-6">
                Real-time AI interviews powered by Gemini Live. Sharpen your skills.
                Land the role you deserve.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="animate-fade-in-delay2 flex gap-8 border-t border-benz-border pt-8">
            {[
              { num: '10K+', label: 'Interviews' },
              { num: '94%',  label: 'Success Rate' },
              { num: '50+',  label: 'Job Roles' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-semibold text-benz-chrome">{s.num}</p>
                <p className="text-xs text-benz-muted tracking-widest uppercase mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom corner accent */}
        <div className="absolute bottom-0 right-0 w-64 h-64 border-b border-r border-benz-border/30 rounded-none" />
      </div>

      {/* ── Right panel: Auth form ── */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20 bg-benz-black relative">
        {/* Top bar (mobile logo) */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          <StarMark size={28} />
          <span className="text-xs tracking-[0.3em] uppercase text-benz-muted">Interview AI</span>
        </div>

        <div className="w-full max-w-sm mx-auto">
          {/* Heading */}
          <div className="mb-10 animate-fade-in">
            <h2 className="text-3xl font-light text-benz-chrome tracking-tight">
              Welcome back
            </h2>
            <p className="text-benz-muted text-sm mt-2">
              Sign in to continue your interview journey
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5 animate-fade-in-delay">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
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
                  className="text-xs text-benz-muted hover:text-benz-silver transition-colors"
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
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-benz-muted hover:text-benz-silver transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-sm px-3 py-2">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" className="w-full mt-2" disabled={loading}>
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-benz-black/30 border-t-benz-black rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6 animate-fade-in-delay2">
            <Separator className="flex-1" />
            <span className="text-benz-muted text-xs tracking-widest uppercase">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Alternative actions */}
          <div className="space-y-3 animate-fade-in-delay2">
            <Button
              variant="ghost"
              size="lg"
              className="w-full"
              onClick={handleGuest}
            >
              Continue as Guest
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full border-benz-gold/40 text-benz-gold-light hover:bg-benz-gold/10 hover:border-benz-gold"
              onClick={handleDemo}
            >
              <Sparkles size={16} />
              Try Demo — No Sign In
            </Button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-benz-muted mt-10 animate-fade-in-delay3">
            Don&apos;t have an account?{' '}
            <Link href="/login" className="text-benz-silver hover:text-benz-chrome transition-colors">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
