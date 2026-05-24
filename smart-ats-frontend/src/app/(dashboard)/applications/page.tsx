'use client';

import { Suspense } from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Application, ApplicationStage } from '@/types';
import { cn, STAGE_LABELS, STAGE_COLORS, getScoreColor, formatDate } from '@/lib/utils';
import { Star, Zap, ChevronRight, Loader2, LayoutGrid, List } from 'lucide-react';

const STAGES: ApplicationStage[] = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

function ApplicationsContent() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [view, setView] = useState<'list' | 'board'>('list');
  const [filterStage, setFilterStage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['applications', jobId, filterStage],
    queryFn: () =>
      api.get('/applications', {
        params: { jobId: jobId || undefined, stage: filterStage || undefined, limit: 100 },
      }).then((r) => r.data),
  });

  const updateStage = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) =>
      api.patch(`/applications/${id}/stage`, { stage }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('Stage updated'); },
  });

  const toggleShortlist = useMutation({
    mutationFn: (id: string) => api.patch(`/applications/${id}/shortlist`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications'] }),
  });

  const triggerScore = useMutation({
    mutationFn: (id: string) => api.post(`/applications/${id}/score`, {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['applications'] }); toast.success('AI scoring complete!'); },
    onError: () => toast.error('AI service unavailable'),
  });

  const apps: Application[] = data?.applications || [];

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = apps.filter((a) => a.stage === s);
    return acc;
  }, {} as Record<string, Application[]>);

  const AppCard = ({ app }: { app: Application }) => (
    <div className="card p-4 space-y-2.5 hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{app.candidate?.name}</p>
          <p className="text-xs text-slate-500 truncate">{app.job?.title}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button onClick={() => toggleShortlist.mutate(app._id)}
            className={cn('p-1 rounded transition-colors', app.isShortlisted ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400')}>
            <Star className="w-3.5 h-3.5" fill={app.isShortlisted ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* AI Score */}
      {app.aiScore ? (
        <div className={cn('flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium', getScoreColor(app.aiScore.overall).replace('text-', 'text-'))}>
          <span className={cn('font-bold text-sm', getScoreColor(app.aiScore.overall))}>{app.aiScore.overall}</span>
          <span className="text-slate-500">/ 100 · {app.aiScore.recommendation?.replace('_', ' ')}</span>
        </div>
      ) : (
        <button onClick={() => triggerScore.mutate(app._id)} disabled={triggerScore.isPending}
          className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg transition-colors w-full">
          {triggerScore.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
          Score with AI
        </button>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <span className="text-xs text-slate-400">{formatDate(app.appliedAt)}</span>
        <Link href={`/applications/${app._id}`} className="text-xs text-indigo-600 hover:underline flex items-center gap-0.5">
          View <ChevronRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Applications</h1>
          <p className="text-sm text-slate-500">{data?.total ?? 0} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-200 overflow-hidden">
            <button onClick={() => setView('list')} className={cn('p-2 transition-colors', view === 'list' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50')}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView('board')} className={cn('p-2 transition-colors', view === 'board' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50')}>
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Stage filter */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilterStage('')}
          className={cn('px-3 py-1.5 text-sm rounded-lg border transition-colors', !filterStage ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
          All ({apps.length})
        </button>
        {STAGES.map((s) => (
          <button key={s} onClick={() => setFilterStage(s)}
            className={cn('px-3 py-1.5 text-sm rounded-lg border transition-colors', filterStage === s ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50')}>
            {STAGE_LABELS[s]} ({byStage[s]?.length || 0})
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card h-40 animate-pulse bg-slate-100" />)}
        </div>
      ) : view === 'board' ? (
        /* Kanban Board */
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => (
            <div key={stage} className="shrink-0 w-72">
              <div className="flex items-center justify-between mb-3">
                <span className={cn('badge', STAGE_COLORS[stage])}>{STAGE_LABELS[stage]}</span>
                <span className="text-xs text-slate-400 font-medium">{byStage[stage]?.length || 0}</span>
              </div>
              <div className="space-y-3">
                {(byStage[stage] || []).map((app) => (
                  <AppCard key={app._id} app={app} />
                ))}
                {(byStage[stage] || []).length === 0 && (
                  <div className="card p-4 border-dashed text-center text-xs text-slate-400">
                    No applications
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="card overflow-hidden">
          {apps.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">No applications yet</div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-slate-100 bg-slate-50">
                <tr>
                  <th className="text-left table-header px-5 py-3">Candidate</th>
                  <th className="text-left table-header px-4 py-3 hidden md:table-cell">Job</th>
                  <th className="text-left table-header px-4 py-3">Stage</th>
                  <th className="text-left table-header px-4 py-3 hidden lg:table-cell">AI Score</th>
                  <th className="text-left table-header px-4 py-3 hidden md:table-cell">Applied</th>
                  <th className="table-header px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {apps.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                          {app.candidate?.name?.[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{app.candidate?.name}</p>
                          <p className="text-xs text-slate-500">{app.candidate?.email}</p>
                        </div>
                        {app.isShortlisted && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <p className="text-sm text-slate-700">{app.job?.title}</p>
                      <p className="text-xs text-slate-400">{app.job?.department}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <select value={app.stage}
                        onChange={(e) => updateStage.mutate({ id: app._id, stage: e.target.value })}
                        className={cn('text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500', STAGE_COLORS[app.stage])}>
                        {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      {app.aiScore ? (
                        <span className={cn('text-sm font-bold', getScoreColor(app.aiScore.overall))}>
                          {app.aiScore.overall}/100
                        </span>
                      ) : (
                        <button onClick={() => triggerScore.mutate(app._id)}
                          className="text-xs text-indigo-600 hover:underline flex items-center gap-1">
                          <Zap className="w-3 h-3" /> Score
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <span className="text-xs text-slate-400">{formatDate(app.appliedAt)}</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={`/applications/${app._id}`} className="text-xs text-indigo-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  return (
    <Suspense fallback={
      <div className="space-y-5">
        <div className="page-header">
          <div>
            <div className="h-7 w-40 bg-slate-100 animate-pulse rounded" />
            <div className="h-4 w-20 bg-slate-100 animate-pulse rounded mt-1" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-40 animate-pulse bg-slate-100" />
          ))}
        </div>
      </div>
    }>
      <ApplicationsContent />
    </Suspense>
  );
}