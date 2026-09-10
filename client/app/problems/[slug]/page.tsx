'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, ApiError } from '../../../lib/api';
import { Problem } from '../../../lib/types';
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Cpu,
  Code2,
} from 'lucide-react';

export default function ProblemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [conflictAttemptId, setConflictAttemptId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .getProblemBySlug(slug)
      .then(async (data) => {
        setProblem(data);
        try {
          const userSummary = await api.getUserAttempts('learner-demo');
          const active = userSummary?.attempts?.find(
            (a) => a.problemId === data.id && a.status === 'IN_PROGRESS',
          );
          if (active) {
            setConflictAttemptId(active.id);
          }
        } catch {
          // ignore lookup error
        }
        setLoading(false);
      })
      .catch(() => {
        setErrorMsg('Failed to load problem specifications.');
        setLoading(false);
      });
  }, [slug]);

  const handleStartAttempt = async () => {
    if (!problem) return;
    if (conflictAttemptId) {
      router.push(`/attempts/${conflictAttemptId}`);
      return;
    }

    setStarting(true);
    setErrorMsg(null);

    try {
      const attempt = await api.startAttempt(problem.id);
      router.push(`/attempts/${attempt.id}`);
    } catch (err: any) {
      setStarting(false);
      if (err instanceof ApiError && err.status === 409) {
        const existingId = err.data?.existingAttemptId;
        if (existingId) {
          setConflictAttemptId(existingId);
        }
        setErrorMsg(err.message || 'An active practice attempt is already in progress for this problem.');
      } else {
        setErrorMsg(err.message || 'Failed to start attempt.');
      }
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent"></div>
        <p className="mt-3 text-xs font-mono text-zinc-400">Loading problem specification...</p>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Problem Not Found</h2>
        <p className="mt-2 text-sm text-zinc-400">The requested problem could not be located.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Catalog
        </Link>
      </div>
    );
  }

  const difficultyConfig = {
    EASY: {
      badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70',
      dotClass: 'bg-emerald-400',
    },
    MEDIUM: {
      badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-800/70',
      dotClass: 'bg-amber-400',
    },
    HARD: {
      badgeClass: 'bg-rose-950/70 text-rose-300 border-rose-800/70',
      dotClass: 'bg-rose-400',
    },
  };

  const diff = difficultyConfig[problem.difficulty] || difficultyConfig.MEDIUM;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Problem Catalog
      </Link>

      {/* Conflict Notice (Duplicate In-Progress Attempt Guard) */}
      {conflictAttemptId && (
        <div className="mb-6 rounded-xl border border-amber-800/80 bg-amber-950/40 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-200">
                Active Attempt In Progress
              </h4>
              <p className="mt-1 text-xs text-amber-300/90 leading-relaxed">
                You already have an active practice session for this problem. To uphold practice continuity, please resume your existing session.
              </p>
              <div className="mt-3">
                <Link
                  href={`/attempts/${conflictAttemptId}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
                >
                  <Play className="h-3.5 w-3.5" /> Resume Active Session
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="mb-6 rounded-lg bg-rose-950/60 p-3.5 text-xs text-rose-200 border border-rose-800">
          {errorMsg}
        </div>
      )}

      {/* Header section */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-xl shadow-black/30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold border ${diff.badgeClass}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${diff.dotClass}`}></span>
              {problem.difficulty}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/80 px-2.5 py-1 text-xs font-mono text-zinc-300 border border-zinc-700/60">
              <Code2 className="h-3.5 w-3.5 text-zinc-400" />
              Format: {problem.expectedFormat === 'BOTH' ? 'TEXT & CODE' : problem.expectedFormat}
            </span>
          </div>

          {/* Action button */}
          <button
            onClick={handleStartAttempt}
            disabled={starting}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
          >
            {starting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                <span>Initializing Session...</span>
              </>
            ) : conflictAttemptId ? (
              <>
                <Play className="h-4 w-4" />
                <span>Resume Active Session</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                <span>Start Practice Session</span>
              </>
            )}
          </button>
        </div>

        <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
          {problem.title}
        </h1>

        <p className="mt-3 text-sm sm:text-base text-zinc-300 leading-relaxed font-normal">
          {problem.description}
        </p>

        {/* Tags */}
        <div className="mt-5 flex flex-wrap gap-2">
          {problem.tags.map((tag, idx) => (
            <span
              key={idx}
              className="rounded-md border border-zinc-700/80 bg-zinc-800/90 px-2.5 py-1 text-xs font-medium text-zinc-200"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Specifications breakdown */}
      <div className="mt-8 grid grid-cols-1 gap-8">
        {/* Functional Requirements */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-md">
          <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-950 text-indigo-400 border border-indigo-800/50">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-white">
              Functional Requirements (Use Cases)
            </h2>
          </div>
          <ul className="mt-4 space-y-3">
            {problem.functionalRequirements.map((req, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-200">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-950 text-[10px] font-bold text-indigo-300 border border-indigo-800/50 mt-0.5">
                  {idx + 1}
                </span>
                <span className="leading-relaxed">{req}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Non-Functional Requirements & Constraints */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-md">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                <Cpu className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-white">
                Non-Functional Requirements
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {problem.nonFunctionalRequirements.map((req, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300">
                  <span className="text-emerald-400 font-bold mt-0.5">&bull;</span>
                  <span className="leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-md">
            <div className="flex items-center gap-2.5 border-b border-zinc-800 pb-3">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-950 text-amber-400 border border-amber-800/50">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-white">
                Constraints & Assumptions
              </h2>
            </div>
            <ul className="mt-4 space-y-2.5">
              {problem.constraints.map((c, idx) => (
                <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-zinc-300">
                  <span className="text-amber-400 font-bold mt-0.5">&bull;</span>
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

