import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'InterviewAI — Ace Your Next Interview',
  description:
    'Real-time AI-powered mock interviews with Gemini Live. Practice smarter, get hired faster.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="bg-benz-black text-benz-chrome antialiased font-sans">{children}</body>
    </html>
  );
}
