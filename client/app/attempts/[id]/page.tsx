'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '../../../lib/api';
import { Attempt } from '../../../lib/types';
import {
  ArrowLeft,
  FileText,
  Code2,
  Send,
  Loader2,
  ExternalLink,
  Clock,
} from 'lucide-react';

// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center bg-[#0a0b0e] text-zinc-400 text-xs font-mono">
      Loading Code Editor...
    </div>
  ),
});

const CODE_STARTER_TEMPLATES: Record<string, string> = {
  typescript: `// Low-Level Design Implementation (TypeScript)
// Define your core entities, interfaces, and design patterns here

export interface IStrategy {
  execute(): void;
}

export class Context {
  constructor(private strategy: IStrategy) {}

  public setStrategy(strategy: IStrategy): void {
    this.strategy = strategy;
  }

  public run(): void {
    this.strategy.execute();
  }
}
`,
  java: `// Low-Level Design Implementation (Java)
// Define your core entities, interfaces, and design patterns here

public interface Strategy {
    void execute();
}

public class Context {
    private Strategy strategy;

    public Context(Strategy strategy) {
        this.strategy = strategy;
    }

    public void setStrategy(Strategy strategy) {
        this.strategy = strategy;
    }

    public void run() {
        if (this.strategy != null) {
            this.strategy.execute();
        }
    }
}
`,
  python: `# Low-Level Design Implementation (Python)
# Define your core entities, interfaces, and design patterns here
from abc import ABC, abstractmethod

class Strategy(ABC):
    @abstractmethod
    def execute(self) -> None:
        pass

class Context:
    def __init__(self, strategy: Strategy):
        self._strategy = strategy

    def set_strategy(self, strategy: Strategy) -> None:
        self._strategy = strategy

    def run(self) -> None:
        if self._strategy:
            self._strategy.execute()
`,
  cpp: `// Low-Level Design Implementation (C++)
// Define your core entities, interfaces, and design patterns here
#include <iostream>
#include <memory>

class Strategy {
public:
    virtual ~Strategy() = default;
    virtual void execute() = 0;
};

class Context {
private:
    std::shared_ptr<Strategy> strategy;

public:
    Context(std::shared_ptr<Strategy> strategy) : strategy(std::move(strategy)) {}

    void setStrategy(std::shared_ptr<Strategy> newStrategy) {
        strategy = std::move(newStrategy);
    }

    void run() {
        if (strategy) {
            strategy->execute();
        }
    }
};
`,
};

export default function PracticeWorkspacePage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = params.id as string;

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFormat, setActiveFormat] = useState<'TEXT' | 'CODE'>('TEXT');

  // Structured text fields
  const [reqs, setReqs] = useState('');
  const [classes, setClasses] = useState('');
  const [relationships, setRelationships] = useState('');
  const [tradeoffs, setTradeoffs] = useState('');

  // Code fields
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState(CODE_STARTER_TEMPLATES.typescript);

  const handleLanguageChange = (newLang: string) => {
    // If editor has empty or default starter code, switch to the template for new language
    const isStarterTemplate =
      !code.trim() ||
      code.trim() ===
        `// Low-Level Design Implementation\n// Define your core entities, interfaces, and design patterns here\n\nexport interface IStrategy {\n  execute(): void;\n}\n\nexport class Context {\n  constructor(private strategy: IStrategy) {}\n}`.trim() ||
      Object.values(CODE_STARTER_TEMPLATES).some((tpl) => tpl.trim() === code.trim());

    if (isStarterTemplate && CODE_STARTER_TEMPLATES[newLang]) {
      setCode(CODE_STARTER_TEMPLATES[newLang]);
    }
    setLanguage(newLang);
  };

  // Mandatory design rationale
  const [designRationale, setDesignRationale] = useState('');

  // Submission & Polling state
  const [submitting, setSubmitting] = useState(false);
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const loadAttempt = React.useCallback(async () => {
    try {
      const data = await api.getAttempt(attemptId);
      setAttempt(data);

      // Pre-populate if latest submission exists
      const submissions = data.submissions || [];
      if (submissions.length > 0) {
        const latest = submissions[submissions.length - 1];
        if (latest.format === 'TEXT' && latest.content) {
          setReqs(latest.content.requirementsAndAssumptions || '');
          setClasses(latest.content.classesAndResponsibilities || '');
          setRelationships(latest.content.relationshipsAndPatterns || '');
          setTradeoffs(latest.content.tradeoffsAndExtensibility || '');
        } else if (latest.format === 'CODE' && latest.content) {
          setCode(latest.content.code || '');
          setLanguage(latest.content.language || 'typescript');
        }
        if (latest.designRationale) {
          setDesignRationale(latest.designRationale);
        }
      }

      setLoading(false);
    } catch {
      setSubmitError('Failed to load attempt.');
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    if (!attemptId) return;
    loadAttempt();

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [attemptId, loadAttempt]);

  const pollSubmissionStatus = (subId: string) => {
    if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);

    pollingTimerRef.current = setInterval(async () => {
      try {
        const sub = await api.getSubmission(subId);
        setLiveStatus(sub.status);

        if (
          sub.status === 'COMPLETED' ||
          sub.status === 'COMPLETED_PARTIAL' ||
          sub.status === 'FAILED'
        ) {
          if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
          setSubmitting(false);

          if (sub.status === 'COMPLETED' || sub.status === 'COMPLETED_PARTIAL') {
            // Auto navigate to feedback view
            setTimeout(() => {
              router.push(`/attempts/${attemptId}/submissions/${subId}`);
            }, 1200);
          }
        }
      } catch (e) {
        console.error('Polling error:', e);
      }
    }, 1500);
  };

  const handleSubmit = async () => {
    if (!designRationale.trim() || designRationale.trim().length < 20) {
      setSubmitError(
        'Mandatory Design Rationale must be at least 20 characters explaining your key design choices and trade-offs.',
      );
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setLiveStatus('PENDING');

    let content: any = {};
    if (activeFormat === 'TEXT') {
      content = {
        requirementsAndAssumptions: reqs,
        classesAndResponsibilities: classes,
        relationshipsAndPatterns: relationships,
        tradeoffsAndExtensibility: tradeoffs,
      };
    } else {
      content = {
        language,
        code,
      };
    }

    try {
      const result = await api.submitSolution(attemptId, {
        format: activeFormat,
        content,
        designRationale,
      });

      setActiveSubmissionId(result.submissionId);
      setLiveStatus(result.status);
      pollSubmissionStatus(result.submissionId);
    } catch (err: any) {
      setSubmitting(false);
      setLiveStatus(null);
      setSubmitError(err.message || 'Submission failed.');
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent"></div>
        <p className="mt-3 text-xs font-mono text-zinc-400">Loading practice workspace...</p>
      </div>
    );
  }

  const problem = attempt?.problem;
  const submissions = attempt?.submissions || [];
  const currentVersion = (submissions.length || 0) + 1;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Top navigation & metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs">
            <Link
              href={problem?.slug ? `/problems/${problem.slug}` : '/'}
              className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Problem Specs
            </Link>
            <span className="text-zinc-600">&bull;</span>
            <span className="font-semibold text-indigo-400 font-mono">
              Revision #{currentVersion} In-Progress
            </span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {problem?.title || 'LLD Practice Workspace'}
          </h1>
        </div>

        {/* Status chip */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Attempt Status: <strong className="text-white">{attempt?.status}</strong></span>
          </div>
        </div>
      </div>

      {/* Main split workspace */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 cols: Design Editor & Rationale */}
        <div className="lg:col-span-3 space-y-6">
          {/* Format selector tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-zinc-900 p-1 border border-zinc-800">
              <button
                onClick={() => setActiveFormat('TEXT')}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeFormat === 'TEXT'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Structured Text Design
              </button>
              <button
                onClick={() => setActiveFormat('CODE')}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  activeFormat === 'CODE'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                Code Implementation
              </button>
            </div>

            {activeFormat === 'CODE' && (
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="typescript">TypeScript</option>
                <option value="java">Java</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
            )}
          </div>

          {/* Editor contents */}
          {activeFormat === 'TEXT' ? (
            <div className="space-y-5">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-white tracking-wide">
                    1. Requirements & Assumptions
                  </label>
                  <span className="text-[10px] font-mono text-indigo-400">Canonical Dim 01</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Scope functional boundaries, actors, scale assumptions, and system constraints.
                </p>
                <textarea
                  rows={4}
                  value={reqs}
                  onChange={(e) => setReqs(e.target.value)}
                  placeholder="e.g. Supports multi-floor parking lot with gate controllers, distinct vehicle types (Compact, Large, EV)..."
                  className="w-full rounded-lg border border-zinc-800 bg-[#0a0b0e] p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed transition-colors"
                />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-white tracking-wide">
                    2. Classes & Responsibilities (Single Responsibility Principle)
                  </label>
                  <span className="text-[10px] font-mono text-indigo-400">Canonical Dim 02</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Entities, controllers, orchestrators, and their distinct single responsibilities.
                </p>
                <textarea
                  rows={5}
                  value={classes}
                  onChange={(e) => setClasses(e.target.value)}
                  placeholder="e.g. ParkingLot (coordinator), Floor (slot container), Slot (state: FREE/OCCUPIED), Gate, Ticket..."
                  className="w-full rounded-lg border border-zinc-800 bg-[#0a0b0e] p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed transition-colors"
                />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-white tracking-wide">
                    3. Key Relationships & Design Patterns Applied
                  </label>
                  <span className="text-[10px] font-mono text-indigo-400">Canonical Dim 03</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  Strategy, Observer, Factory, or State patterns; interface contracts and loose coupling.
                </p>
                <textarea
                  rows={4}
                  value={relationships}
                  onChange={(e) => setRelationships(e.target.value)}
                  placeholder="e.g. Strategy pattern used for fee calculation (IPricingStrategy), Factory for slot allocation..."
                  className="w-full rounded-lg border border-zinc-800 bg-[#0a0b0e] p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed transition-colors"
                />
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-white tracking-wide">
                    4. Trade-offs & Extensibility
                  </label>
                  <span className="text-[10px] font-mono text-indigo-400">Canonical Dim 04</span>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  How the design handles changing requirements, concurrency, and performance trade-offs.
                </p>
                <textarea
                  rows={4}
                  value={tradeoffs}
                  onChange={(e) => setTradeoffs(e.target.value)}
                  placeholder="e.g. Synchronized floor locks vs atomic counters. Extensible to new payment gateways via OCP..."
                  className="w-full rounded-lg border border-zinc-800 bg-[#0a0b0e] p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none font-sans leading-relaxed transition-colors"
                />
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-[#0a0b0e] shadow-xl">
              <MonacoEditor
                height="480px"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          )}

          {/* Mandatory Design Rationale Box */}
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-5 shadow-xl shadow-indigo-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-400" />
                <label className="text-xs font-bold text-indigo-200">
                  Mandatory Design Rationale & Architectural Trade-offs (Required)
                </label>
              </div>
              <span className="text-[11px] font-mono font-medium text-indigo-400">
                {designRationale.length} characters
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-300 leading-relaxed">
              Provide a 2–5 sentence justification of your key architectural trade-offs. This will be evaluated directly under the <strong className="text-indigo-300">Explanation Quality</strong> rubric criterion.
            </p>
            <textarea
              rows={3}
              value={designRationale}
              onChange={(e) => setDesignRationale(e.target.value)}
              placeholder="e.g. I selected the Strategy pattern for fee calculation to decouple dynamic pricing algorithms from checkout orchestration, accepting slightly higher class count for frictionless future extensibility..."
              className="mt-3 w-full rounded-lg border border-indigo-500/30 bg-[#0a0b0e] p-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 focus:outline-none leading-relaxed transition-colors"
            />
          </div>

          {/* Submission and Live Status banner */}
          {submitError && (
            <div className="rounded-lg bg-rose-950/60 p-3.5 text-xs text-rose-200 border border-rose-800">
              {submitError}
            </div>
          )}

          {liveStatus && (
            <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/30 p-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">
                      Asynchronous Evaluation in Progress (BullMQ + Rule-Based Engine)
                    </h4>
                    <p className="text-[11px] text-indigo-300 mt-0.5">
                      Current queue status: <span className="font-semibold font-mono uppercase text-white">{liveStatus}</span> &mdash; Analyzing solution...
                    </p>
                  </div>
                </div>

                {activeSubmissionId && (
                  <Link
                    href={`/attempts/${attemptId}/submissions/${activeSubmissionId}`}
                    className="rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
                  >
                    View Report
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Submit action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Evaluating Revision #{currentVersion}...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Revision #{currentVersion} for Grading</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right 1 col: Revision History & Requirements Sidebar */}
        <div className="space-y-6">
          {/* Quick Problem Spec Summary */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 font-mono">
              Problem Requirements
            </h3>
            <p className="mt-2 text-sm text-white font-bold">
              {problem?.title}
            </p>
            <ul className="mt-3.5 space-y-2 text-xs text-zinc-300">
              {problem?.functionalRequirements.slice(0, 3).map((req, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold mt-0.5">&bull;</span>
                  <span className="line-clamp-2 leading-relaxed">{req}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/problems/${problem?.slug}`}
              target="_blank"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <span>Open full specs in new tab</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Past Submissions Revisions List */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-md">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-zinc-400" />
                <h3 className="text-xs font-bold text-white">
                  Revision History
                </h3>
              </div>
              <span className="rounded-md bg-zinc-800 px-2 py-0.5 text-[10px] font-mono font-semibold text-zinc-300 border border-zinc-700/60">
                {submissions.length} {submissions.length === 1 ? 'Revision' : 'Revisions'}
              </span>
            </div>

            {submissions.length === 0 ? (
              <p className="mt-4 text-center text-xs text-zinc-400 py-3">
                No submissions handed in yet. Submit your first revision!
              </p>
            ) : (
              <div className="mt-3 space-y-2.5">
                {submissions.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/attempts/${attemptId}/submissions/${sub.id}`}
                    className="block rounded-lg border border-zinc-800 bg-zinc-950/80 p-3 hover:border-zinc-700 hover:bg-zinc-800/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Revision #{sub.version}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                          sub.status === 'COMPLETED'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                            : sub.status === 'COMPLETED_PARTIAL'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <div className="mt-1.5 flex items-center justify-between text-xs text-zinc-400">
                      <span className="font-mono text-[11px]">{sub.format}</span>
                      {sub.evaluation ? (
                        <span className="font-bold text-indigo-400 font-mono">
                          Score: {sub.evaluation.overallScore}/5.0
                        </span>
                      ) : (
                        <span className="italic text-zinc-500">Pending</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


