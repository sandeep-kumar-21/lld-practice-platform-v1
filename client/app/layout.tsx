import type { Metadata } from 'next';
import './globals.css';
import { Navbar } from '../components/Navbar';

export const metadata: Metadata = {
  title: 'LLD Studio | Low-Level Design Practice & Evaluation',
  description:
    'Rigorous Low-Level Design practice platform with async BullMQ queueing, deterministic structural checks, and AI-powered rubric judgment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased" style={{ colorScheme: 'dark' }}>
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100 selection:bg-indigo-500/20 selection:text-indigo-300 font-sans">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-zinc-800/80 bg-zinc-950 py-5 text-center text-xs text-zinc-400">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-300">LLD Studio</span>
              <span>&mdash; Engineering Design Practice & Rubric Evaluation</span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-zinc-400 font-mono">
              <span>MySQL 8.0</span>
              <span>&bull;</span>
              <span>Redis BullMQ</span>
              <span>&bull;</span>
              <span>Rule-Based Architecture Engine</span>
              <span>&bull;</span>
              <span>NestJS</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
