'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Code2,
  BookOpen,
  BarChart3,
  ExternalLink,
  Activity,
  AlertCircle,
  Terminal,
} from 'lucide-react';
import { api } from '../lib/api';

export function Navbar() {
  const pathname = usePathname();
  const [healthStatus, setHealthStatus] = useState<'healthy' | 'unhealthy' | 'checking'>('checking');

  useEffect(() => {
    let mounted = true;
    api
      .getHealth()
      .then((res) => {
        if (mounted) {
          if (res.services?.mysql === 'healthy' && res.services?.redis === 'healthy') {
            setHealthStatus('healthy');
          } else {
            setHealthStatus('unhealthy');
          }
        }
      })
      .catch(() => {
        if (mounted) setHealthStatus('unhealthy');
      });

    return () => {
      mounted = false;
    };
  }, []);

  const navLinks = [
    { href: '/', label: 'Problem Catalog', icon: BookOpen },
    { href: '/history', label: 'Progress & Weaknesses', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-7">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 text-indigo-400 group-hover:border-indigo-500/50 group-hover:text-indigo-300 transition-all shadow-sm">
              <Code2 className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-zinc-100 group-hover:text-white transition-colors">
                LLD Studio
              </span>
              <span className="text-[10px] font-mono text-zinc-400 leading-none">
                practice &bull; evaluate &bull; iterate
              </span>
            </div>
          </Link>

          {/* Navigation tabs */}
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-zinc-800/80 text-zinc-100 shadow-sm border border-zinc-700/60'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side utilities */}
        <div className="flex items-center gap-3">
          {/* Health indicator */}
          <div
            className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/80 px-2.5 py-1 text-xs font-medium text-zinc-400"
            title="Local MySQL (3306) and Redis (6379) readiness probe"
          >
            {healthStatus === 'healthy' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-mono font-medium text-emerald-400">
                  Services Online
                </span>
              </>
            ) : healthStatus === 'checking' ? (
              <>
                <Activity className="h-3 w-3 animate-pulse text-zinc-500" />
                <span className="text-[11px] font-mono">Checking...</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 text-rose-400" />
                <span className="text-[11px] font-mono text-rose-400">Degraded</span>
              </>
            )}
          </div>

          {/* Swagger docs link */}
          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-900/60 px-2.5 py-1 text-xs font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all md:flex"
          >
            <Terminal className="h-3 w-3 text-zinc-400" />
            <span>API Docs</span>
            <ExternalLink className="h-2.5 w-2.5 text-zinc-500" />
          </a>

          {/* Learner pill */}
          <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 py-0.5 pl-1 pr-2.5">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/30 text-[10px] font-bold text-indigo-300 border border-indigo-500/30 font-mono">
              L
            </div>
            <span className="text-[11px] font-medium text-zinc-300">learner-demo</span>
          </div>
        </div>
      </div>
    </header>
  );
}
