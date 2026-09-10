'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../../lib/api';
import { Submission } from '../../../../../lib/types';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Minus,
  Play,
  Cpu,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

export default function SubmissionFeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;
  const submissionId = params.submissionId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const loadSubmission = React.useCallback(async () => {
    try {
      const data = await api.getSubmission(submissionId);
      setSubmission(data);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load submission:', err);
      setLoading(false);
    }
  }, [submissionId]);

  useEffect(() => {
    if (!submissionId) return;
    loadSubmission();
  }, [submissionId, loadSubmission]);

  const handleRetryEvaluation = async () => {
    setRetrying(true);
    setRetryMessage(null);
    try {
      await api.retryEvaluation(submissionId);
      setRetryMessage('Evaluation re-enqueued. Reloading status...');
      setTimeout(() => {
        router.push(`/attempts/${attemptId}`);
      }, 1500);
    } catch (err: any) {
      setRetryMessage(err.message || 'Retry failed.');
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent"></div>
        <p className="mt-3 text-xs font-mono text-zinc-400">Loading evaluation report...</p>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Submission Not Found</h2>
        <Link
          href={`/attempts/${attemptId}`}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Workspace
        </Link>
      </div>
    );
  }

  const evaluation = submission.evaluation;
  const comparison = submission.versionComparison;

  const getScoreBadgeColor = (score: number) => {
    if (score >= 4.0)
      return 'text-emerald-300 bg-emerald-950/70 border-emerald-800/70';
    if (score >= 3.0)
      return 'text-amber-300 bg-amber-950/70 border-amber-800/70';
    return 'text-rose-300 bg-rose-950/70 border-rose-800/70';
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back button & attempt link */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href={`/attempts/${attemptId}`}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Practice Workspace
        </Link>
        <span className="text-xs font-mono text-zinc-400">
          Submission Revision #{submission.version} &bull; {new Date(submission.createdAt).toLocaleTimeString()}
        </span>
      </div>

      {/* Degradation Banner if COMPLETED_PARTIAL */}
      {submission.status === 'COMPLETED_PARTIAL' && (
        <div className="mb-6 rounded-xl border border-amber-800/80 bg-amber-950/40 p-5 shadow-md">
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-200">
                Graceful Degradation: Deterministic Checks Active
              </h4>
              <p className="mt-1 text-xs text-amber-300/90 leading-relaxed">
                {evaluation?.overallSummary ||
                  'AI feedback was temporarily unavailable after retries. The evaluation below reflects deterministic rule-based checks.'}
              </p>
              <div className="mt-3">
                <button
                  onClick={handleRetryEvaluation}
                  disabled={retrying}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50 transition-colors"
                >
                  <Play className="h-3.5 w-3.5" />
                  {retrying ? 'Re-enqueuing...' : 'Retry AI Evaluation'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {retryMessage && (
        <div className="mb-6 rounded-lg bg-indigo-950/60 p-3.5 text-xs text-indigo-200 border border-indigo-800">
          {retryMessage}
        </div>
      )}

      {/* Hero Score Card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/90 p-6 sm:p-8 shadow-xl shadow-black/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-md bg-indigo-950/80 border border-indigo-800/60 px-2.5 py-1 text-xs font-semibold text-indigo-300">
              <Cpu className="h-3.5 w-3.5 text-indigo-400" />
              Evaluator: {evaluation?.evaluatorType}
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Evaluation & Feedback Report
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-zinc-300 max-w-2xl leading-relaxed">
              {evaluation?.overallSummary}
            </p>
          </div>

          {/* Large Overall Score Chip */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-950/90 p-6 min-w-[150px] text-center shadow-inner">
            <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">
              Overall Score
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-4xl font-extrabold text-indigo-400">
                {evaluation ? evaluation.overallScore : 0}
              </span>
              <span className="text-xs font-bold text-zinc-500">/ 5.0</span>
            </div>
            <span className="mt-1 text-[11px] font-mono text-zinc-400">
              Weighted Rubric
            </span>
          </div>
        </div>

        {/* Version-to-version improvement delta card */}
        {comparison && comparison.hasPreviousVersion && (
          <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white">
                  Revision Improvement Delta (vs. Revision #{submission.version - 1})
                </h3>
              </div>
              <span
                className={`flex items-center gap-1 rounded-md px-2.5 py-0.5 text-xs font-bold border ${
                  comparison.overallDelta === 'IMPROVED'
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800/70'
                    : comparison.overallDelta === 'REGRESSED'
                    ? 'bg-rose-950/70 text-rose-300 border-rose-800/70'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {comparison.overallDelta === 'IMPROVED' && <TrendingUp className="h-3 w-3" />}
                {comparison.overallDelta === 'REGRESSED' && <TrendingDown className="h-3 w-3" />}
                {comparison.overallDelta === 'SAME' && <Minus className="h-3 w-3" />}
                {comparison.overallDelta === 'IMPROVED'
                  ? `+${comparison.overallScoreDifference} Overall`
                  : `${comparison.overallScoreDifference ?? 0} Delta`}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              {comparison.comparisons.map((c, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                    c.delta === 'IMPROVED'
                      ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                      : c.delta === 'REGRESSED'
                      ? 'border-rose-800/60 bg-rose-950/40 text-rose-300'
                      : 'border-zinc-800 bg-zinc-900 text-zinc-400'
                  }`}
                  title={c.summary}
                >
                  <span>{c.criterionName}:</span>
                  <strong className="font-mono">
                    {c.delta === 'IMPROVED' ? `+${c.scoreDifference}` : c.scoreDifference}
                  </strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Design Rationale Display */}
      <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-md">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">
            Learner Design Rationale Submitted
          </h3>
          <span className="text-[11px] font-mono text-zinc-500">Explanation Quality Input</span>
        </div>
        <p className="mt-3 text-xs sm:text-sm text-zinc-200 italic leading-relaxed">
          &ldquo;{submission.designRationale}&rdquo;
        </p>
      </div>

      {/* Rubric Criteria Breakdown Grid */}
      <div className="mt-8">
        <div className="flex items-center justify-between pb-4">
          <h2 className="text-lg font-bold text-white">
            Rubric Criteria Breakdown ({evaluation?.criterionResults.length || 0} Criteria)
          </h2>
          <span className="text-xs font-mono text-zinc-400">Scale: 0.0 - 5.0 per dimension</span>
        </div>

        <div className="space-y-4">
          {evaluation?.criterionResults.map((result, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-md hover:border-zinc-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-950 text-xs font-bold text-indigo-300 border border-indigo-800/50">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {result.criterionName}
                  </h3>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] uppercase font-mono font-semibold text-zinc-400">
                    Confidence: {result.confidence}
                  </span>
                  <span
                    className={`rounded-md border px-2.5 py-1 text-xs font-extrabold font-mono shadow-sm ${getScoreBadgeColor(
                      result.score,
                    )}`}
                  >
                    {result.score} / 5.0
                  </span>
                </div>
              </div>

              {/* 3-Part Feedback: Evidence, Concern, Suggestion */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Evidence */}
                <div className="rounded-lg bg-[#0a0b0e] border border-zinc-800/80 p-3.5">
                  <span className="font-bold text-zinc-400 uppercase text-[10px] font-mono tracking-wider block mb-1.5">
                    Observed Evidence
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-normal">
                    {result.evidence}
                  </p>
                </div>

                {/* Concern */}
                <div className="rounded-lg bg-amber-950/30 border border-amber-800/50 p-3.5">
                  <span className="font-bold text-amber-400 uppercase text-[10px] font-mono tracking-wider block mb-1.5">
                    Architectural Concern
                  </span>
                  <p className="text-amber-200 leading-relaxed font-normal">
                    {result.concern}
                  </p>
                </div>

                {/* Suggestion */}
                <div className="rounded-lg bg-indigo-950/30 border border-indigo-800/50 p-3.5">
                  <span className="font-bold text-indigo-400 uppercase text-[10px] font-mono tracking-wider block mb-1.5">
                    Actionable Suggestion
                  </span>
                  <p className="text-indigo-200 leading-relaxed font-normal">
                    {result.suggestion}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Iterative practice CTA */}
      <div className="mt-10 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/80 via-zinc-900 to-zinc-950 p-6 sm:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <h3 className="text-lg font-extrabold text-white">Ready to improve your design score?</h3>
          <p className="mt-1 text-xs sm:text-sm text-indigo-200">
            Address the concerns and suggestions above by submitting Revision #{submission.version + 1} on this attempt.
          </p>
        </div>
        <Link
          href={`/attempts/${attemptId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
        >
          <span>Iterate & Submit Revision #{submission.version + 1}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}


