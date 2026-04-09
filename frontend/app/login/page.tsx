'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Sparkles, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth, authErrorMessage } from '@/lib/auth-context';

/* ── Brand mark ─────────────────────────────────────────────────────────── */
function BrandMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" aria-hidden>
      <circle cx="50" cy="50" r="46" stroke="url(#bm1)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="36" stroke="url(#bm1)" strokeWidth="0.6" opacity="0.3" />
      <path d="M50 10 L53.2 44 L85 55 L53.2 58 L50 90 L46.8 58 L15 55 L46.8 44 Z" fill="url(#bm2)" />
      <defs>
        <linearGradient id="bm1" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3A3A3A" />
          <stop offset="50%" stopColor="#D0D0D0" />
          <stop offset="100%" stopColor="#3A3A3A" />
        </linearGradient>
        <linearGradient id="bm2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#555" />
          <stop offset="50%" stopColor="#E0E0E0" />
          <stop offset="100%" stopColor="#555" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ── Google icon ─────────────────────────────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 32.6 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 16 19 12 24 12c3.1 0 5.8 1.1 8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.4 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-4.9l-6.2-5.2C29.4 35.6 26.8 36 24 36c-5.2 0-9.5-3.4-11.2-8H6.4C9.8 35.6 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.3 35.7 44 30.3 44 24c0-1.3-.1-2.7-.4-4z" />
    </svg>
  );
}

/* ── Sign-in form ────────────────────────────────────────────────────────── */
function SignInForm() {
  const { signIn, signInGoogle } = useAuth();
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState('');

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please enter your email and password'); return; }
    setLoading(true); setError('');
    try {
      await signIn(email, password);
      router.push('/');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true); setError('');
    try {
      await signInGoogle();
      router.push('/');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Google */}
      <Button
        type="button"
        variant="outline"
        size="lg"
        className="w-full gap-2.5"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading
          ? <span className="w-4 h-4 rounded-full border-2 border-benz-border border-t-benz-silver animate-spin" />
          : <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-benz-border" />
        <span className="text-[0.65rem] text-benz-muted uppercase tracking-[0.12em]">or</span>
        <div className="flex-1 h-px bg-benz-border" />
      </div>

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="si-email">Email address</Label>
          <Input id="si-email" type="email" placeholder="you@example.com"
            value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="si-pass">Password</Label>
            <button type="button" className="text-[0.65rem] text-benz-muted hover:text-benz-silver transition-colors">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Input id="si-pass" type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="current-password" className="pr-11" />
            <button type="button" onClick={() => setShowPass((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-benz-muted hover:text-benz-silver transition-colors">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading
            ? <span className="w-4 h-4 rounded-full border-2 border-benz-black/25 border-t-benz-black animate-spin" />
            : <>Sign In <ArrowRight size={15} /></>}
        </Button>
      </form>
    </div>
  );
}

/* ── Sign-up form ────────────────────────────────────────────────────────── */
function SignUpForm() {
  const { signUp, signInGoogle } = useAuth();
  const router = useRouter();
  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [showPass, setShowPass]     = useState(false);
  const [loading, setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]           = useState('');

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (password !== confirm)  { setError('Passwords do not match'); return; }
    if (password.length < 6)   { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      await signUp(email, password, name.trim() || undefined);
      router.push('/');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true); setError('');
    try {
      await signInGoogle();
      router.push('/');
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Google */}
      <Button type="button" variant="outline" size="lg" className="w-full gap-2.5"
        onClick={handleGoogle} disabled={googleLoading}>
        {googleLoading
          ? <span className="w-4 h-4 rounded-full border-2 border-benz-border border-t-benz-silver animate-spin" />
          : <GoogleIcon />}
        Sign up with Google
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-benz-border" />
        <span className="text-[0.65rem] text-benz-muted uppercase tracking-[0.12em]">or</span>
        <div className="flex-1 h-px bg-benz-border" />
      </div>

      <form onSubmit={handleSignUp} className="space-y-3.5">
        <div className="space-y-1.5">
          <Label htmlFor="su-name">Full name <span className="text-benz-muted/50">(optional)</span></Label>
          <Input id="su-name" type="text" placeholder="John Doe"
            value={name} onChange={(e) => { setName(e.target.value); setError(''); }}
            autoComplete="name" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="su-email">Email address</Label>
          <Input id="su-email" type="email" placeholder="you@example.com"
            value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
            autoComplete="email" />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="su-pass">Password</Label>
          <div className="relative">
            <Input id="su-pass" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
              value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }}
              autoComplete="new-password" className="pr-11" />
            <button type="button" onClick={() => setShowPass((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-benz-muted hover:text-benz-silver transition-colors">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="su-confirm">Confirm password</Label>
          <Input id="su-confirm" type="password" placeholder="••••••••"
            value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }}
            autoComplete="new-password" />
        </div>

        {/* Password strength hint */}
        {password.length > 0 && (
          <div className="flex gap-1.5 items-center">
            {[1,2,3,4].map((level) => {
              const strength = password.length >= 12 ? 4 : password.length >= 8 ? 3 : password.length >= 6 ? 2 : 1;
              const colors = ['bg-red-500', 'bg-amber-400', 'bg-yellow-300', 'bg-emerald-400'];
              return (
                <div key={level} className={`h-1 flex-1 rounded-full transition-colors ${level <= strength ? colors[strength - 1] : 'bg-benz-surface3'}`} />
              );
            })}
            <span className="text-[0.6rem] text-benz-muted ml-1">
              {password.length >= 12 ? 'Strong' : password.length >= 8 ? 'Good' : password.length >= 6 ? 'Fair' : 'Weak'}
            </span>
          </div>
        )}

        {error && (
          <p className="text-xs text-red-400 bg-red-500/[0.08] border border-red-500/20 rounded-xl px-3.5 py-2.5">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading
            ? <span className="w-4 h-4 rounded-full border-2 border-benz-black/25 border-t-benz-black animate-spin" />
            : <>Create Account <ArrowRight size={15} /></>}
        </Button>

        <p className="text-center text-[0.65rem] text-benz-muted leading-relaxed">
          By creating an account you agree to our{' '}
          <span className="text-benz-silver underline underline-offset-2 cursor-pointer">Terms</span>
          {' '}&amp;{' '}
          <span className="text-benz-silver underline underline-offset-2 cursor-pointer">Privacy Policy</span>.
        </p>
      </form>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already signed in
  useEffect(() => {
    if (!loading && user) router.replace('/');
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex">

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden bg-benz-dark">
        <div className="absolute inset-0 opacity-[0.025]" style={{
          backgroundImage: 'linear-gradient(rgba(200,200,200,1) 1px,transparent 1px),linear-gradient(90deg,rgba(200,200,200,1) 1px,transparent 1px)',
          backgroundSize: '72px 72px',
        }} />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-benz-silver/[0.035] blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full px-14 py-12">
          <div className="flex items-center gap-3 animate-fade-in">
            <BrandMark size={32} />
            <span className="text-[0.7rem] tracking-[0.28em] uppercase text-benz-muted">
              Interview<span className="text-benz-silver">AI</span>
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center max-w-xs animate-fade-in-delay">
            <p className="flex items-center gap-3 text-[0.65rem] tracking-[0.4em] uppercase text-benz-gold mb-8">
              <span className="inline-block w-8 h-px bg-benz-gold opacity-70" />
              Precision Training
            </p>
            <h1 className="text-[3.25rem] font-light leading-[1.08] text-benz-chrome tracking-tightest">
              The Best<br />
              <span className="text-shimmer font-semibold">Version</span><br />
              of You.
            </h1>
            <p className="mt-6 text-sm text-benz-muted leading-relaxed max-w-[260px]">
              Real-time voice interviews powered by Gemini Live. Practice smarter, land the role you deserve.
            </p>
          </div>

          <div className="animate-fade-in-delay2 border-t border-benz-border pt-8 grid grid-cols-3 gap-6">
            {[{ n: '10K+', l: 'Interviews' }, { n: '94%', l: 'Success Rate' }, { n: '50+', l: 'Job Roles' }].map((s) => (
              <div key={s.l}>
                <p className="text-2xl font-semibold text-benz-chrome">{s.n}</p>
                <p className="mt-1 text-[0.65rem] text-benz-muted uppercase tracking-[0.12em]">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 right-0 w-48 h-48 border-b border-r border-benz-border/20" />
      </div>

      {/* ── Right auth panel ── */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-14 lg:px-20 bg-benz-black overflow-y-auto">
        {/* Mobile logo */}
        <div className="absolute top-7 left-7 flex items-center gap-2 lg:hidden">
          <BrandMark size={26} />
          <span className="text-[0.65rem] tracking-[0.28em] uppercase text-benz-muted">InterviewAI</span>
        </div>

        <div className="w-full max-w-[380px] mx-auto py-16">
          {/* Tabs */}
          <Tabs defaultValue="signin" className="animate-fade-in">
            <TabsList className="w-full mb-8">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Create Account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <div className="mb-7">
                <h2 className="text-[1.6rem] font-light text-benz-chrome tracking-tight">Welcome back</h2>
                <p className="mt-1.5 text-sm text-benz-muted">Sign in to continue your journey</p>
              </div>
              <SignInForm />
            </TabsContent>

            <TabsContent value="signup">
              <div className="mb-7">
                <h2 className="text-[1.6rem] font-light text-benz-chrome tracking-tight">Create account</h2>
                <p className="mt-1.5 text-sm text-benz-muted">Start practising for free today</p>
              </div>
              <SignUpForm />
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="flex items-center gap-3 mt-6 mb-4">
            <div className="flex-1 h-px bg-benz-border" />
            <span className="text-[0.65rem] text-benz-muted uppercase tracking-[0.12em]">or</span>
            <div className="flex-1 h-px bg-benz-border" />
          </div>

          {/* Guest / Demo */}
          <div className="space-y-2.5">
            <Button variant="ghost" size="lg" className="w-full" onClick={() => router.push('/')}>
              <User size={15} /> Continue as Guest
            </Button>
            <Button variant="ghost" size="lg"
              className="w-full border border-benz-gold/25 text-benz-gold-light hover:bg-benz-gold/[0.07] hover:border-benz-gold/40"
              onClick={() => router.push('/demo')}>
              <Sparkles size={15} /> Try Demo — No sign in required
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
