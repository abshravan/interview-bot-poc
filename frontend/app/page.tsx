'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { uploadResume, createSession } from '@/lib/api';
import styles from './page.module.css';

const JOB_ROLES = [
  'Software Engineer',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'DevOps Engineer',
  'Data Scientist',
  'Machine Learning Engineer',
  'Cybersecurity Analyst',
  'Product Manager',
  'QA Engineer',
];

export default function HomePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped?.type === 'application/pdf') {
      setFile(dropped);
      setError('');
    } else {
      setError('Please drop a PDF file');
    }
  }

  async function handleStart() {
    if (!file) return setError('Please upload your resume');
    if (!role) return setError('Please select a job role');

    setLoading(true);
    setError('');

    try {
      const { resumeId } = await uploadResume(file);
      const { sessionId } = await createSession(resumeId, role);
      router.push(`/interview?sessionId=${sessionId}`);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>AI</div>
          <h1 className={styles.title}>Interview Prep</h1>
          <p className={styles.subtitle}>
            Upload your resume, pick a role, and practice with a live AI interviewer
          </p>
        </div>

        {/* Resume Upload */}
        <section className={styles.section}>
          <label className={styles.label}>Resume (PDF)</label>
          <div
            className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''} ${file ? styles.hasFile : ''}`}
            onDrop={handleFileDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            {file ? (
              <>
                <span className={styles.fileIcon}>📄</span>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>({(file.size / 1024).toFixed(1)} KB)</span>
              </>
            ) : (
              <>
                <span className={styles.uploadIcon}>⬆️</span>
                <span>Drag & drop your PDF here or <strong>click to browse</strong></span>
              </>
            )}
            <input
              id="fileInput"
              type="file"
              accept=".pdf"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setFile(f); setError(''); }
              }}
            />
          </div>
        </section>

        {/* Role Selector */}
        <section className={styles.section}>
          <label className={styles.label} htmlFor="roleSelect">Job Role</label>
          <select
            id="roleSelect"
            className={styles.select}
            value={role}
            onChange={(e) => { setRole(e.target.value); setError(''); }}
          >
            <option value="">Select a role...</option>
            {JOB_ROLES.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </section>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.startBtn}
          onClick={handleStart}
          disabled={loading || !file || !role}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            'Start Interview'
          )}
        </button>
      </div>
    </main>
  );
}
