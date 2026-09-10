'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '../lib/api';
import { Problem } from '../lib/types';
import {
  ArrowRight,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  Code2,
} from 'lucide-react';

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchTag, setSearchTag] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    const filter = {
      difficulty: selectedDifficulty === 'ALL' ? undefined : selectedDifficulty,
      tag: searchTag.trim() ? searchTag.trim() : undefined,
    };

    api
      .getProblems(filter)
      .then((data) => {
        setProblems(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load problems:', err);
        setLoading(false);
      });
  }, [selectedDifficulty, searchTag]);

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header section with practice loop guide */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 p-6 sm:p-8 shadow-xl shadow-black/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-mono text-indigo-300 mb-4">
              <Code2 className="h-3.5 w-3.5 text-indigo-400" />
              <span>Domain Design Practice Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Low-Level Design Problem Catalog
            </h1>
            <p className="mt-3 text-sm text-zinc-300 leading-relaxed max-w-xl">
              Sharpen your object-oriented modeling, design pattern selection, and architectural trade-off justification. Every submission is evaluated against 8 canonical rubric dimensions using fast deterministic checks and intelligent rule-based architectural analysis.
            </p>
          </div>

          {/* Interactive practice loop indicator */}
          <div className="flex flex-col gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 text-xs font-mono text-zinc-300 min-w-[320px] shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                The Practice Loop
              </span>
              <span className="text-[10px] text-indigo-400 font-semibold">Iterative Rubric</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 text-center font-medium mt-1">
              <div className="rounded-lg bg-zinc-900/90 p-2 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <span className="block text-indigo-400 text-[10px] font-bold">01</span>
                <span className="text-[11px] text-zinc-200">Select</span>
              </div>
              <div className="rounded-lg bg-zinc-900/90 p-2 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <span className="block text-indigo-400 text-[10px] font-bold">02</span>
                <span className="text-[11px] text-zinc-200">Design</span>
              </div>
              <div className="rounded-lg bg-zinc-900/90 p-2 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <span className="block text-indigo-400 text-[10px] font-bold">03</span>
                <span className="text-[11px] text-zinc-200">Submit</span>
              </div>
              <div className="rounded-lg bg-zinc-900/90 p-2 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <span className="block text-indigo-400 text-[10px] font-bold">04</span>
                <span className="text-[11px] text-zinc-200">Rubric</span>
              </div>
              <div className="rounded-lg bg-zinc-900/90 p-2 border border-zinc-800 hover:border-zinc-700 transition-colors">
                <span className="block text-indigo-400 text-[10px] font-bold">05</span>
                <span className="text-[11px] text-zinc-200">Iterate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and search controls */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-zinc-400" />
          <span className="text-xs font-mono font-medium text-zinc-300">
            {problems.length} {problems.length === 1 ? 'Problem' : 'Problems'} Available
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Difficulty pill selectors */}
          <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900 p-1 text-xs font-medium">
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`rounded-md px-3 py-1 transition-all ${
                  selectedDifficulty === diff
                    ? 'bg-zinc-800 text-white font-semibold shadow-sm border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          {/* Search by tag */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tag (e.g. Strategy, Concurrency)..."
              value={searchTag}
              onChange={(e) => setSearchTag(e.target.value)}
              className="rounded-lg border border-zinc-700/80 bg-zinc-900 pl-9 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none w-52 sm:w-64 font-sans transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Problems Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-r-transparent"></div>
          <p className="mt-3 text-xs font-mono text-zinc-400">
            Loading problem catalog...
          </p>
        </div>
      ) : problems.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-zinc-800 bg-zinc-900/40 p-12 text-center">
          <p className="text-sm text-zinc-300">
            No design problems found matching the selected filters.
          </p>
          <button
            onClick={() => {
              setSelectedDifficulty('ALL');
              setSearchTag('');
            }}
            className="mt-3 text-xs font-mono font-semibold text-indigo-400 hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => {
            const diff = difficultyConfig[problem.difficulty] || difficultyConfig.MEDIUM;

            return (
              <div
                key={problem.id}
                className="group relative flex flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/90 p-6 shadow-md transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1 overflow-hidden"
              >
                {/* Subtle top edge glow on card hover */}
                <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/0 to-transparent group-hover:via-indigo-500/80 transition-all duration-300" />

                <div>
                  {/* Top Meta Pills */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold tracking-wide border shadow-sm ${diff.badgeClass}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${diff.dotClass}`}></span>
                      {problem.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300 border border-zinc-700">
                      <Code2 className="h-3.5 w-3.5 text-zinc-400" />
                      {problem.expectedFormat === 'BOTH' ? 'TEXT & CODE' : problem.expectedFormat}
                    </span>
                  </div>

                  {/* Problem Title */}
                  <h3 className="mt-4 text-base sm:text-lg font-bold text-white group-hover:text-indigo-300 transition-colors leading-snug tracking-tight">
                    {problem.title}
                  </h3>

                  {/* Problem description excerpt with high contrast */}
                  <p className="mt-2.5 text-xs sm:text-sm text-zinc-300 line-clamp-3 leading-relaxed font-normal">
                    {problem.description}
                  </p>

                  {/* Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {problem.tags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-md border border-zinc-700/80 bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-200"
                      >
                        {tag}
                      </span>
                    ))}
                    {problem.tags.length > 3 && (
                      <span className="rounded-md border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-[11px] font-medium text-zinc-400 self-center">
                        +{problem.tags.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action footer */}
                <div className="mt-6 pt-4 border-t border-zinc-800 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                    <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                    8 Rubric Criteria
                  </span>

                  <Link
                    href={`/problems/${problem.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 group-hover:bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-zinc-200 group-hover:text-white border border-zinc-700 group-hover:border-indigo-500 shadow-sm transition-all duration-150"
                  >
                    <span>Start Attempt</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
