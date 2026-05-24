'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Application, ApplicationStage } from '@/types';
import { cn, STAGE_LABELS, STAGE_COLORS, getScoreColor, getScoreBg, formatDate } from '@/lib/utils';
import {
  ArrowLeft, Plus, X, Loader2, Users, Star, Zap,
  Edit2, Eye, ChevronRight, Briefcase, Sparkles,
  CheckCheck, TrendingUp, AlertCircle, BarChart2, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import ApplyCandidateModal from '@/components/jobs/ApplyCandidateModal';

const EMPTY_FORM = {
  title: '', department: '', location: '', locationType: 'hybrid',
  type: 'full-time', description: '', requirements: [] as string[],
  responsibilities: [] as string[], skills: [] as string[],
  experienceMin: 0, experienceMax: 5, salaryMin: '', salaryMax: '',
  currency: 'INR', status: 'open', deadline: '',
};

const SCORE_THRESHOLD = 70;

// ─── Tier badge ───────────────────────────────────────────────────────────────

const TIER_STYLES: Record<string, string> = {
  excellent: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  good:      'bg-blue-50 text-blue-700 border border-blue-200',
  fair:      'bg-amber-50 text-amber-700 border border-amber-200',
  low:       'bg-slate-100 text-slate-500 border border-slate-200',
  unknown:   'bg-slate-100 text-slate-400',
};

const TIER_LABEL: Record<string, string> = {
  excellent: '🎯 Excellent',
  good:      '✅ Good',
  fair:      '🔶 Fair',
  low:       '⬇️ Low',
};

// ─── Ranked Candidates Panel ──────────────────────────────────────────────────

interface RankedCandidate {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  stage: string;
  isShortlisted: boolean;
  aiScore: { overall: number; recommendation?: string } | null;
  semanticScore: number | null;
  similarityRaw: number | null;
  tier: string;
  matchedConcepts: string[];
  summary: string;
}

function RankedPanel({ jobId }: { jobId: string }) {
  const {
    data,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['ranked', jobId],
    queryFn: () =>
      api.get(`/applications/rank/${jobId}`).then((r) => r.data),
    enabled: false,           // only runs when user clicks "Run"
    retry: false,
    staleTime: 5 * 60 * 1000, // cache 5 min — embeddings are expensive
  });

  const ranked: RankedCandidate[] = data?.ranked ?? [];
  const hasRun = data !== undefined || isError;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-500" />
          <h2 className="font-semibold text-slate-900">Semantic Ranking</h2>
          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
            AI · Embeddings
          </span>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-primary text-sm flex items-center gap-2"
        >
          {isFetching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isFetching ? 'Running…' : hasRun ? 'Re-run' : 'Run Semantic Match'}
        </button>
      </div>

      {/* Explanation banner — show before first run */}
      {!hasRun && !isFetching && (
        <div className="card p-5 flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">
              Semantic candidate matching
            </p>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              Uses <strong className="text-slate-700">sentence-transformer embeddings</strong> (all-MiniLM-L6-v2)
              to measure deep semantic similarity between each candidate's full
              profile and this job's description, skills, and requirements —
              not just keyword overlap. Runs locally, no API cost.
            </p>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {isFetching && (
        <div className="card overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-slate-50 animate-pulse">
              <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-200 rounded w-40" />
                <div className="h-3 bg-slate-100 rounded w-64" />
              </div>
              <div className="w-16 h-7 bg-slate-200 rounded-lg shrink-0" />
            </div>
          ))}
          <div className="px-5 py-3 bg-slate-50 text-xs text-slate-400 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Computing embeddings… first run may take ~10s while the model warms up
          </div>
        </div>
      )}

      {/* Error */}
      {isError && !isFetching && (
        <div className="card p-5 flex items-center gap-3 text-red-600">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-sm font-semibold">AI service unavailable</p>
            <p className="text-xs text-red-400 mt-0.5">
              Make sure the AI service container is running, then try again.
            </p>
          </div>
        </div>
      )}

      {/* Empty */}
      {hasRun && !isFetching && !isError && ranked.length === 0 && (
        <div className="card py-12 text-center">
          <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No applicants to rank yet.</p>
        </div>
      )}

      {/* Results table */}
      {ranked.length > 0 && !isFetching && (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="text-left table-header px-5 py-3">Rank</th>
                <th className="text-left table-header px-4 py-3">Candidate</th>
                <th className="text-left table-header px-4 py-3">Semantic score</th>
                <th className="text-left table-header px-4 py-3 hidden lg:table-cell">AI score</th>
                <th className="text-left table-header px-4 py-3 hidden md:table-cell">Stage</th>
                <th className="text-left table-header px-4 py-3 hidden xl:table-cell">Matched skills</th>
                <th className="table-header px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ranked.map((r, idx) => (
                <tr key={r.applicationId} className="hover:bg-slate-50/50 transition-colors">
                  {/* Rank */}
                  <td className="px-5 py-3.5 w-14">
                    <span className={cn(
                      'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                      idx === 0 ? 'bg-amber-100 text-amber-700' :
                      idx === 1 ? 'bg-slate-100 text-slate-600' :
                      idx === 2 ? 'bg-orange-50 text-orange-600' :
                      'bg-slate-50 text-slate-400',
                    )}>
                      {idx + 1}
                    </span>
                  </td>

                  {/* Candidate */}
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {r.candidateName?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{r.candidateName}</p>
                        <p className="text-xs text-slate-500 truncate">{r.candidateEmail}</p>
                      </div>
                      {r.isShortlisted && (
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-current shrink-0" />
                      )}
                    </div>
                  </td>

                  {/* Semantic score */}
                  <td className="px-4 py-3.5">
                    {r.semanticScore !== null ? (
                      <div className="flex items-center gap-2.5">
                        <div className="flex flex-col items-start gap-1">
                          <div className="flex items-center gap-1.5">
                            <span className={cn(
                              'text-sm font-bold',
                              r.semanticScore >= 75 ? 'text-emerald-600' :
                              r.semanticScore >= 55 ? 'text-blue-600' :
                              r.semanticScore >= 35 ? 'text-amber-600' : 'text-slate-400',
                            )}>
                              {r.semanticScore}
                            </span>
                            <span className="text-xs text-slate-400">/100</span>
                          </div>
                          <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                r.semanticScore >= 75 ? 'bg-emerald-500' :
                                r.semanticScore >= 55 ? 'bg-blue-500' :
                                r.semanticScore >= 35 ? 'bg-amber-500' : 'bg-slate-300',
                              )}
                              style={{ width: `${r.semanticScore}%` }}
                            />
                          </div>
                        </div>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium hidden sm:inline-block', TIER_STYLES[r.tier] ?? TIER_STYLES.unknown)}>
                          {TIER_LABEL[r.tier] ?? r.tier}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>

                  {/* Existing LLM AI score */}
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    {r.aiScore?.overall != null ? (
                      <span className={cn('text-sm font-bold', getScoreColor(r.aiScore.overall))}>
                        {r.aiScore.overall}/100
                      </span>
                    ) : (
                      <span className="text-xs text-slate-300">not scored</span>
                    )}
                  </td>

                  {/* Stage */}
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={cn(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      STAGE_COLORS[r.stage as ApplicationStage] ?? 'bg-slate-100 text-slate-600',
                    )}>
                      {STAGE_LABELS[r.stage as ApplicationStage] ?? r.stage}
                    </span>
                  </td>

                  {/* Matched skills */}
                  <td className="px-4 py-3.5 hidden xl:table-cell max-w-xs">
                    {r.matchedConcepts.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {r.matchedConcepts.slice(0, 4).map((skill) => (
                          <span key={skill} className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded">
                            {skill}
                          </span>
                        ))}
                        {r.matchedConcepts.length > 4 && (
                          <span className="text-xs text-slate-400">+{r.matchedConcepts.length - 4}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-300">none detected</span>
                    )}
                  </td>

                  {/* View link */}
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/applications/${r.applicationId}`}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                    >
                      View <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Footer note */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Ranked by semantic similarity · all-MiniLM-L6-v2 · cosine distance
            </p>
            <p className="text-xs text-slate-400">
              {ranked.length} candidate{ranked.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Smart Shortlist Panel ────────────────────────────────────────────────────

interface SmartShortlistPanelProps {
  apps: Application[];
  onShortlistAll: (ids: string[]) => void;
  isBulkLoading: boolean;
}

function SmartShortlistPanel({ apps, onShortlistAll, isBulkLoading }: SmartShortlistPanelProps) {
  const [dismissed, setDismissed] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const suggestions = apps.filter(
    (a) => (a.aiScore?.overall ?? 0) > SCORE_THRESHOLD && !a.isShortlisted,
  );
  const unscored = apps.filter((a) => !a.aiScore).length;

  useEffect(() => {
    setSelected(new Set(suggestions.map((a) => a._id)));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestions.length]);

  if (dismissed || suggestions.length === 0) {
    if (!dismissed && unscored > 0 && apps.length > 0) {
      return (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-500">
          <AlertCircle className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            <strong className="text-slate-700">{unscored} candidate{unscored > 1 ? 's' : ''}</strong> haven't been AI-scored yet.
            Score them to unlock smart shortlisting suggestions.
          </span>
        </div>
      );
    }
    return null;
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const allSelected = selected.size === suggestions.length;
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(suggestions.map((a) => a._id)));

  return (
    <div className="mb-5 border border-indigo-200 bg-indigo-50/60 rounded-xl overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-indigo-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-indigo-900">
              AI found {suggestions.length} top candidate{suggestions.length > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-indigo-500 mt-0.5">
              Scored above {SCORE_THRESHOLD}/100 · not yet shortlisted
            </p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-indigo-300 hover:text-indigo-500 hover:bg-indigo-100 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="divide-y divide-indigo-100/70">
        {suggestions.map((app) => {
          const score = app.aiScore!.overall;
          const isChecked = selected.has(app._id);
          return (
            <label
              key={app._id}
              className={cn(
                'flex items-center gap-3 px-5 py-3 cursor-pointer transition-colors',
                isChecked ? 'bg-indigo-50' : 'bg-white hover:bg-indigo-50/40',
              )}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(app._id)}
                className="w-4 h-4 accent-indigo-600 shrink-0"
              />
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs shrink-0">
                {app.candidate?.name?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate">{app.candidate?.name}</p>
                <p className="text-xs text-slate-400 truncate">{app.candidate?.email}</p>
              </div>
              <div className={cn('flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0', getScoreBg(score))}>
                <TrendingUp className="w-3 h-3" />
                {score}/100
              </div>
              {app.aiScore?.recommendation && (
                <span className={cn(
                  'hidden sm:block text-xs font-medium px-2 py-0.5 rounded-full shrink-0',
                  app.aiScore.recommendation === 'strong_yes'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700',
                )}>
                  {app.aiScore.recommendation === 'strong_yes' ? '⭐ Strong yes' : '✅ Yes'}
                </span>
              )}
              <Link
                href={`/applications/${app._id}`}
                onClick={(e) => e.stopPropagation()}
                className="hidden sm:inline-flex items-center gap-0.5 text-xs text-indigo-500 hover:text-indigo-700 hover:underline shrink-0"
              >
                View <ChevronRight className="w-3 h-3" />
              </Link>
            </label>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-white border-t border-indigo-100">
        <button onClick={toggleAll} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors">
          {allSelected ? 'Deselect all' : 'Select all'}
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{selected.size} of {suggestions.length} selected</span>
          <button
            onClick={() => onShortlistAll(Array.from(selected))}
            disabled={selected.size === 0 || isBulkLoading}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
              selected.size > 0
                ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed',
            )}
          >
            {isBulkLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
            Shortlist {selected.size > 0 ? `${selected.size} candidate${selected.size > 1 ? 's' : ''}` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Applications Panel ───────────────────────────────────────────────────────

type TabId = 'all' | 'ranked';

function ApplicationsPanel({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [bulkShortlistLoading, setBulkShortlistLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['applications', jobId],
    queryFn: () =>
      api
        .get('/applications', { params: { jobId, limit: 50, sortBy: 'appliedAt', order: 'desc' } })
        .then((r) => r.data),
  });

  const toggleShortlist = useMutation({
    mutationFn: (id: string) => api.patch(`/applications/${id}/shortlist`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', jobId] }),
  });

  const triggerScore = useMutation({
    mutationFn: (id: string) => api.post(`/applications/${id}/score`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', jobId] });
      toast.success('AI scoring complete!');
    },
    onError: () => toast.error('AI service unavailable'),
  });

  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      api.patch(`/applications/${id}/stage`, { stage }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications', jobId] });
      toast.success('Stage updated');
    },
  });

  const handleShortlistAll = async (ids: string[]) => {
    if (ids.length === 0) return;
    setBulkShortlistLoading(true);
    try {
      await Promise.all(ids.map((id) => api.patch(`/applications/${id}/shortlist`, {})));
      await qc.invalidateQueries({ queryKey: ['applications', jobId] });
      toast.success(`${ids.length} candidate${ids.length > 1 ? 's' : ''} shortlisted!`, { icon: '⭐' });
    } catch {
      toast.error('Some shortlists failed, please try again');
    } finally {
      setBulkShortlistLoading(false);
    }
  };

  const apps: Application[] = data?.applications || [];

  const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'all',    label: 'All Applicants', icon: <Users className="w-3.5 h-3.5" /> },
    { id: 'ranked', label: 'Semantic Ranking', icon: <BarChart2 className="w-3.5 h-3.5" /> },
  ];

  return (
    <>
      {/* Tab bar */}
      <div className="flex items-center gap-1 mb-4 border-b border-slate-100 pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.id === 'all' && data?.total != null && (
              <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">
                {data.total}
              </span>
            )}
            {tab.id === 'ranked' && (
              <span className="text-xs bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">
                AI
              </span>
            )}
          </button>
        ))}

        {/* Add candidate button pushed to the right */}
        <div className="flex-1" />
        <button
          className="btn-primary text-sm mb-1"
          onClick={() => setShowApplyModal(true)}
        >
          <Plus className="w-4 h-4" /> Apply Candidate
        </button>
      </div>

      {/* ── Tab: All Applicants ── */}
      {activeTab === 'all' && (
        <>
          {!isLoading && apps.length > 0 && (
            <SmartShortlistPanel
              apps={apps}
              onShortlistAll={handleShortlistAll}
              isBulkLoading={bulkShortlistLoading}
            />
          )}

          <div className="card overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading applicants…
              </div>
            ) : apps.length === 0 ? (
              <div className="py-12 text-center">
                <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-medium">No applicants yet</p>
                <p className="text-slate-400 text-xs mt-1 mb-4">
                  Add candidates directly from your talent pool
                </p>
                <button className="btn-primary text-sm mx-auto" onClick={() => setShowApplyModal(true)}>
                  <Plus className="w-4 h-4" /> Apply First Candidate
                </button>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50">
                  <tr>
                    <th className="text-left table-header px-5 py-3">Candidate</th>
                    <th className="text-left table-header px-4 py-3 hidden md:table-cell">Stage</th>
                    <th className="text-left table-header px-4 py-3 hidden lg:table-cell">AI Score</th>
                    <th className="text-left table-header px-4 py-3 hidden md:table-cell">Applied</th>
                    <th className="table-header px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {apps.map((app) => (
                    <tr key={app._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {app.candidate?.name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{app.candidate?.name}</p>
                            <p className="text-xs text-slate-500">{app.candidate?.email}</p>
                          </div>
                          <button
                            onClick={() => toggleShortlist.mutate(app._id)}
                            className={cn(
                              'p-1 rounded transition-colors',
                              app.isShortlisted ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400',
                            )}
                          >
                            <Star className="w-3.5 h-3.5" fill={app.isShortlisted ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <select
                          value={app.stage}
                          onChange={(e) => updateStage.mutate({ id: app._id, stage: e.target.value })}
                          className={cn(
                            'text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-1 focus:ring-indigo-300',
                            STAGE_COLORS[app.stage] ?? 'bg-slate-100 text-slate-600',
                          )}
                        >
                          {(['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'] as ApplicationStage[]).map(
                            (s) => <option key={s} value={s}>{STAGE_LABELS[s] ?? s}</option>,
                          )}
                        </select>
                      </td>
                      <td className="px-4 py-3.5 hidden lg:table-cell">
                        {app.aiScore?.overall != null ? (
                          <div className="flex items-center gap-2">
                            <span className={cn('text-sm font-bold', getScoreColor(app.aiScore.overall))}>
                              {app.aiScore.overall}
                            </span>
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${app.aiScore.overall}%` }} />
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => triggerScore.mutate(app._id)}
                            disabled={triggerScore.isPending}
                            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                          >
                            {triggerScore.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                            Score
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell">
                        <span className="text-xs text-slate-500">{formatDate(app.appliedAt)}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link href={`/applications/${app._id}`} className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                          View <ChevronRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ── Tab: Semantic Ranking ── */}
      {activeTab === 'ranked' && <RankedPanel jobId={jobId} />}

      {showApplyModal && (
        <ApplyCandidateModal
          jobId={jobId}
          jobTitle={jobTitle}
          onClose={() => setShowApplyModal(false)}
          onSuccess={() => {
            setShowApplyModal(false);
            qc.invalidateQueries({ queryKey: ['applications', jobId] });
          }}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const router = useRouter();
  const params = useParams();
  const qc = useQueryClient();
  const isNew = params.id === 'new';

  const [mode, setMode] = useState<'view' | 'edit'>(isNew ? 'edit' : 'view');
  const [form, setForm] = useState(EMPTY_FORM);
  const [newSkill, setNewSkill] = useState('');
  const [newReq, setNewReq] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['job', params.id],
    queryFn: () => api.get(`/jobs/${params.id}`).then((r) => r.data.job),
    enabled: !isNew,
  });

  useEffect(() => {
    if (data) setForm({ ...EMPTY_FORM, ...data });
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      isNew ? api.post('/jobs', form) : api.put(`/jobs/${params.id}`, form),
    onSuccess: () => {
      toast.success(isNew ? 'Job posted!' : 'Job updated!');
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['job', params.id] });
      if (isNew) router.push('/jobs');
      else setMode('view');
    },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed to save'),
  });

  const addSkill = () => {
    if (newSkill.trim() && !form.skills.includes(newSkill.trim())) {
      setForm({ ...form, skills: [...form.skills, newSkill.trim()] });
      setNewSkill('');
    }
  };

  const addReq = () => {
    if (newReq.trim()) {
      setForm({ ...form, requirements: [...form.requirements, newReq.trim()] });
      setNewReq('');
    }
  };

  if (!isNew && isLoading) return <div className="card p-8 animate-pulse h-96" />;

  // ── View mode ──────────────────────────────────────────────────────────────
  if (mode === 'view' && data) {
    return (
      <div className="max-w-4xl space-y-5">
        <div className="flex items-center gap-3">
          <Link href="/jobs" className="btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="page-title truncate">{data.title}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {data.department} · {data.location} · {data.locationType}
            </p>
          </div>
          <button className="btn-secondary flex items-center gap-2" onClick={() => setMode('edit')}>
            <Edit2 className="w-4 h-4" /> Edit Job
          </button>
        </div>

        <div className="card p-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="label mb-0.5">Type</p>
            <p className="text-slate-700 capitalize">{data.type?.replace('-', ' ')}</p>
          </div>
          <div>
            <p className="label mb-0.5">Status</p>
            <span className={cn(
              'inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize',
              data.status === 'open'   ? 'bg-emerald-50 text-emerald-700' :
              data.status === 'draft'  ? 'bg-slate-100 text-slate-600' :
              data.status === 'paused' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-600',
            )}>
              {data.status}
            </span>
          </div>
          <div>
            <p className="label mb-0.5">Experience</p>
            <p className="text-slate-700">{data.experienceMin}–{data.experienceMax} yrs</p>
          </div>
          <div>
            <p className="label mb-0.5">Applications</p>
            <p className="text-slate-700 font-semibold">{data.totalApplications ?? 0}</p>
          </div>
        </div>

        {data.skills?.length > 0 && (
          <div className="card p-5">
            <p className="label mb-2">Required Skills</p>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((s: string) => (
                <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-lg">{s}</span>
              ))}
            </div>
          </div>
        )}

        {data.description && (
          <div className="card p-5">
            <p className="label mb-2">Job Description</p>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{data.description}</p>
          </div>
        )}

        <div>
          <ApplicationsPanel jobId={params.id as string} jobTitle={data.title} />
        </div>
      </div>
    );
  }

  // ── Edit / Create mode ─────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-center gap-3">
        {isNew ? (
          <Link href="/jobs" className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></Link>
        ) : (
          <button className="btn-secondary p-2" onClick={() => setMode('view')}><ArrowLeft className="w-4 h-4" /></button>
        )}
        <h1 className="page-title">{isNew ? 'Post New Job' : 'Edit Job'}</h1>
      </div>

      <div className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Job Title *</label>
            <input className="input" placeholder="e.g. Senior React Developer"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Department *</label>
            <input className="input" placeholder="Engineering"
              value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </div>
          <div>
            <label className="label">Location *</label>
            <input className="input" placeholder="Mumbai, India"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div>
            <label className="label">Location Type</label>
            <select className="input" value={form.locationType} onChange={(e) => setForm({ ...form, locationType: e.target.value })}>
              <option value="remote">Remote</option>
              <option value="onsite">Onsite</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </div>
          <div>
            <label className="label">Job Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="full-time">Full-time</option>
              <option value="part-time">Part-time</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="open">Open</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="label">Application Deadline</label>
            <input type="date" className="input" value={form.deadline?.split('T')[0] || ''}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Min Experience (yrs)</label>
            <input type="number" className="input" min={0} value={form.experienceMin}
              onChange={(e) => setForm({ ...form, experienceMin: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Max Experience (yrs)</label>
            <input type="number" className="input" min={0} value={form.experienceMax}
              onChange={(e) => setForm({ ...form, experienceMax: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Min Salary</label>
            <input type="number" className="input" placeholder="500000" value={form.salaryMin}
              onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} />
          </div>
          <div>
            <label className="label">Max Salary</label>
            <input type="number" className="input" placeholder="1200000" value={form.salaryMax}
              onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Job Description *</label>
          <textarea className="input h-32 resize-none" placeholder="Describe the role…"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        <div>
          <label className="label">Skills</label>
          <div className="flex gap-2 mb-2">
            <input className="input flex-1" placeholder="e.g. React" value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
            <button type="button" className="btn-secondary" onClick={addSkill}><Plus className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-wrap gap-2">
            {form.skills.map((s) => (
              <span key={s} className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-lg">
                {s}
                <button onClick={() => setForm({ ...form, skills: form.skills.filter((x) => x !== s) })}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="label">Requirements</label>
          <div className="flex gap-2 mb-2">
            <input className="input flex-1" placeholder="e.g. 4+ years of React experience" value={newReq}
              onChange={(e) => setNewReq(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReq())} />
            <button type="button" className="btn-secondary" onClick={addReq}><Plus className="w-4 h-4" /></button>
          </div>
          <ul className="space-y-1">
            {form.requirements.map((r, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                <span className="flex-1">{r}</span>
                <button onClick={() => setForm({ ...form, requirements: form.requirements.filter((_, j) => j !== i) })}>
                  <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
          {!isNew && (
            <button className="btn-secondary" onClick={() => setMode('view')}>Cancel</button>
          )}
          <button className="btn-primary" onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isNew ? 'Post Job' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}