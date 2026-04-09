'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Star } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-benz-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border border-benz-border flex items-center justify-center animate-pulse-ring">
            <Star size={20} className="text-benz-silver" />
          </div>
          <p className="text-xs text-benz-muted uppercase tracking-widest">Loading</p>
        </div>
      </div>
    );
  }

  if (!user) return null; // redirecting

  return <>{children}</>;
}
