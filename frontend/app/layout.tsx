import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Interview Prep',
  description: 'Practice interviews with an AI interviewer powered by Gemini Live',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
