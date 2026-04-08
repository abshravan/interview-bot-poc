import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InterviewAI — Ace Your Next Interview',
  description: 'Real-time AI-powered mock interviews with Gemini Live. Practice smarter, get hired faster.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-benz-black text-benz-chrome antialiased">{children}</body>
    </html>
  );
}
