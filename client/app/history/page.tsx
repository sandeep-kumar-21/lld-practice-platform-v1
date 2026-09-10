'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { UserAttemptsSummary } from '../../lib/types';
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Play,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function LearnerHistoryPage() {
  const [summary, setSummary] = useState<UserAttemptsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getUserAttempts('learner-demo')
      .then((data) => {
        setSummary(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load user attempts:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent"></div>
        <p className="mt-3 text-xs font-mono text-zinc-400">Loading learner history and analytics...</p>
      </div>
    );
  }

  const difficultyColors: Record<string, string> = {
    EASY: 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70',
    MEDIUM: 'bg-amber-950/70 text-amber-300 border-amber-800/70',
    HARD: 'bg-rose-950/70 text-rose-300 border-rose-800/70',
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-mono text-indigo-300 mb-3">
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
            <span>Learner Practice Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            Attempt History & Recurring Weaknesses
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-zinc-300">
            Track your design evolution across iterations and review persistent rubric weaknesses identified across your submissions.
          </p>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all self-start sm:self-center cursor-pointer"
        >
          <Play className="h-3.5 w-3.5" /> New Practice Session
        </Link>
      </div>

      {/* High-level Statistics cards */}
      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-5">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
          <span className="text-xs font-mono font-medium text-zinc-400">Total Attempts</span>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            {summary?.totalAttempts || 0}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
          <span className="text-xs font-mono font-medium text-zinc-400">Completed Sessions</span>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-400">
            {summary?.completedAttempts || 0}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
          <span className="text-xs font-mono font-medium text-zinc-400">Active In-Progress</span>
          <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-400">
            {summary?.inProgressAttempts || 0}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
          <span className="text-xs font-mono font-medium text-zinc-400">Overall Average Score</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-400 font-mono">
              {summary?.overallAverageScore || 0}
            </span>
            <span className="text-xs font-bold text-zinc-500 font-mono">/ 5.0</span>
          </div>
        </div>
      </div>

      {/* Recurring Weaknesses Spotlight Section */}
      <div className="mt-10">
        <div className="flex items-center gap-2 pb-4">
          <TrendingDown className="h-5 w-5 text-rose-400" />
          <h2 className="text-lg font-bold text-white">
            Recurring Rubric Weaknesses
          </h2>
          <span className="text-xs text-zinc-400 font-mono">
            (Criteria consistently scoring below 3.4 / 5.0)
          </span>
        </div>

        {summary?.recurringWeaknesses && summary.recurringWeaknesses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {summary.recurringWeaknesses.map((weakness, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-rose-800/60 bg-rose-950/20 p-5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white">
                    {weakness.criterionName}
                  </h3>
                  <span className="rounded-md border border-rose-800/80 bg-rose-950/80 px-2.5 py-0.5 text-xs font-mono font-extrabold text-rose-300">
                    Avg: {weakness.averageScore} / 5.0
                  </span>
                </div>
                <p className="mt-2.5 text-xs text-zinc-200 leading-relaxed font-normal">
                  {weakness.advice}
                </p>
                <div className="mt-3.5 flex items-center gap-3 text-[11px] font-mono text-zinc-400 border-t border-rose-900/40 pt-2.5">
                  <span>Evaluated across {weakness.evaluationCount} attempts</span>
                  <span>&bull;</span>
                  <span>Lowest score: {weakness.lowestScore}</span>
                </div>
              </div>
            ))}
          </div>
        ) : summary?.overallAverageScore === 0 ? (
          <div className="rounded-xl border border-zinc-800/80 bg-[#121316] p-8 text-center shadow-md">
            <BarChart3 className="mx-auto h-8 w-8 text-zinc-500" />
            <p className="mt-3 text-sm font-semibold text-white">
              No Evaluated Submissions Yet
            </p>
            <p className="mt-1 text-xs text-zinc-400 max-w-md mx-auto">
              Submit your low-level design solutions for evaluation. As the architectural rule engine evaluates your designs against the 8-criterion rubric, recurring weaknesses and targeted advice will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800/80 bg-[#121316] p-8 text-center shadow-md">
            <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-400" />
            <p className="mt-3 text-sm font-semibold text-white">
              No Recurring Weaknesses Detected!
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Your submissions have consistently met or exceeded standard rubric thresholds across all evaluated criteria.
            </p>
          </div>
        )}
      </div>

      {/* Strengths Section */}
      {summary?.strengths && summary.strengths.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 pb-4">
            <TrendingUp className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Consistent Strengths
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {summary.strengths.map((strength, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-4 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">
                    {strength.criterionName}
                  </h4>
                  <span className="text-xs font-bold text-emerald-400 font-mono">
                    {strength.averageScore} / 5.0
                  </span>
                </div>
                <p className="mt-2 text-xs text-zinc-300 leading-relaxed">
                  {strength.advice}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Attempts Table */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-white mb-4">
          All Practice Sessions
        </h2>

        {summary?.attempts && summary.attempts.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/90 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-800 bg-zinc-950 text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <tr>
                    <th className="px-5 py-3.5">Problem</th>
                    <th className="px-5 py-3.5">Difficulty</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5">Revisions</th>
                    <th className="px-5 py-3.5">Best Score</th>
                    <th className="px-5 py-3.5">Started At</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {summary.attempts.map((attempt) => (
                    <tr
                      key={attempt.id}
                      className="hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-bold text-white">
                        {attempt.problemTitle}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                            difficultyColors[attempt.difficulty] || difficultyColors.MEDIUM
                          }`}
                        >
                          {attempt.difficulty}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-md border px-2.5 py-0.5 text-[10px] font-mono font-semibold ${
                            attempt.status === 'IN_PROGRESS'
                              ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                              : 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                          }`}
                        >
                          {attempt.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-zinc-300">
                        {attempt.submissionCount} {attempt.submissionCount === 1 ? 'revision' : 'revisions'}
                      </td>
                      <td className="px-5 py-4">
                        {attempt.bestScore !== null && attempt.bestScore !== undefined ? (
                          <span className="font-extrabold text-indigo-400 font-mono">
                            {attempt.bestScore} / 5.0
                          </span>
                        ) : (
                          <span className="text-zinc-500 font-mono">&mdash;</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-zinc-400 font-mono text-[11px]">
                        {new Date(attempt.startedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/attempts/${attempt.id}`}
                          className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                        >
                          <span>Open</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
            <p className="text-zinc-400 text-sm">No practice attempts recorded yet.</p>
            <Link
              href="/"
              className="mt-3 inline-block text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Explore problems and start practicing &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

