const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export async function uploadResume(file: File): Promise<{ resumeId: string; filename: string }> {
  const form = new FormData();
  form.append('resume', file);
  const res = await fetch(`${BASE}/api/resume/upload`, { method: 'POST', body: form });
  if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
  return res.json();
}

export async function createSession(
  resumeId: string,
  role: string
): Promise<{ sessionId: string }> {
  const res = await fetch(`${BASE}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resumeId, role }),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Session creation failed');
  return res.json();
}

export async function generateFeedback(sessionId: string) {
  const res = await fetch(`${BASE}/api/feedback/${sessionId}`, { method: 'POST' });
  if (!res.ok) throw new Error((await res.json()).error || 'Feedback generation failed');
  return res.json();
}

export async function getFeedback(sessionId: string) {
  const res = await fetch(`${BASE}/api/feedback/${sessionId}`);
  if (!res.ok) throw new Error((await res.json()).error || 'Could not load feedback');
  return res.json();
}

export async function getSession(sessionId: string) {
  const res = await fetch(`${BASE}/api/sessions/${sessionId}`);
  if (!res.ok) throw new Error((await res.json()).error || 'Session not found');
  return res.json();
}
