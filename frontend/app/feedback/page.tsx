'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getFeedback, getSession } from '@/lib/api';
import styles from './feedback.module.css';

interface Feedback {
  strengths: string[];
  weaknesses: string[];
  communicationScore: number;
  technicalScore: number;
  suggestions: string[];
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const pct = (score / 10) * 100;
  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (pct / 100) * circumference;

  const color = score >= 8 ? '#4caf89' : score >= 6 ? '#6c63ff' : score >= 4 ? '#ffb347' : '#ef5350';

  return (
    <div className={styles.scoreRing}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r="36" fill="none" stroke="#2e3148" strokeWidth="8" />
        <circle
          cx="45"
          cy="45"
          r="36"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="45" y="49" textAnchor="middle" fill={color} fontSize="18" fontWeight="700">
          {score}
        </text>
      </svg>
      <span className={styles.scoreLabel}>{label}</span>
    </div>
  );
}

export default function FeedbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    async function load() {
      try {
        const [fb, session] = await Promise.all([
          getFeedback(sessionId!),
          getSession(sessionId!),
        ]);
        setFeedback(fb);
        setRole(session.role);
      } catch (err: any) {
        setError(err.message || 'Failed to load feedback');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [sessionId]);

  if (loading) {
    return (
      <main className={styles.main}>
        <div className={styles.loadingCard}>
          <span className={styles.spinner} />
          <p>Loading your feedback...</p>
        </div>
      </main>
    );
  }

  if (error || !feedback) {
    return (
      <main className={styles.main}>
        <div className={styles.errorCard}>
          <h2>Something went wrong</h2>
          <p>{error || 'No feedback available'}</p>
          <button className={styles.retryBtn} onClick={() => router.push('/')}>
            Back to Home
          </button>
        </div>
      </main>
    );
  }

  const overallScore = Math.round((feedback.communicationScore + feedback.technicalScore) / 2);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        {/* Title */}
        <div className={styles.titleSection}>
          <div className={styles.logo}>AI</div>
          <div>
            <h1 className={styles.title}>Interview Feedback</h1>
            {role && <p className={styles.subtitle}>Role: {role}</p>}
          </div>
        </div>

        {/* Score Cards */}
        <div className={styles.scoresRow}>
          <ScoreRing score={feedback.communicationScore} label="Communication" />
          <div className={styles.overallScore}>
            <span className={styles.overallNumber}>{overallScore}</span>
            <span className={styles.overallLabel}>Overall</span>
            <span className={styles.overallSub}>out of 10</span>
          </div>
          <ScoreRing score={feedback.technicalScore} label="Technical" />
        </div>

        {/* Strengths */}
        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} ${styles.strengthTitle}`}>Strengths</h2>
          <ul className={styles.list}>
            {feedback.strengths.map((s, i) => (
              <li key={i} className={`${styles.listItem} ${styles.strength}`}>
                <span className={styles.listIcon}>✓</span>
                {s}
              </li>
            ))}
          </ul>
        </section>

        {/* Weaknesses */}
        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} ${styles.weaknessTitle}`}>Areas to Improve</h2>
          <ul className={styles.list}>
            {feedback.weaknesses.map((w, i) => (
              <li key={i} className={`${styles.listItem} ${styles.weakness}`}>
                <span className={styles.listIcon}>△</span>
                {w}
              </li>
            ))}
          </ul>
        </section>

        {/* Suggestions */}
        <section className={styles.section}>
          <h2 className={`${styles.sectionTitle} ${styles.suggestionTitle}`}>Suggestions</h2>
          <ol className={styles.suggestionList}>
            {feedback.suggestions.map((s, i) => (
              <li key={i} className={styles.suggestionItem}>
                <span className={styles.suggestionNum}>{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </section>

        <button className={styles.homeBtn} onClick={() => router.push('/')}>
          Practice Again
        </button>
      </div>
    </main>
  );
}
