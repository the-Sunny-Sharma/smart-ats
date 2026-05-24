'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { cn, formatDate, getScoreColor, getScoreBg, STAGE_COLORS, STAGE_LABELS, RECOMMENDATION_LABELS } from '@/lib/utils';
import {
  ArrowLeft, Star, StarOff, Zap, Calendar, ChevronRight, FileText,
  CheckCircle, XCircle, AlertCircle, Clock, Briefcase, User, MessageSquare,
  TrendingUp, Award, Target, Loader2
} from 'lucide-react';
import { Application } from '@/types';
import ScheduleInterviewModal from '@/components/interviews/ScheduleInterviewModal';

const STAGES = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const;

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [showReview, setShowReview] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['application', id],
    queryFn: () => api.get(`/applications/${id}`).then((r) => r.data.application) as Promise<Application>,
  });

  const updateStage = useMutation({
    mutationFn: ({ stage, note }: { stage: string; note?: string }) =>
      api.patch(`/applications/${id}/stage`, { stage, note }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', id] }),
  });

  const toggleShortlist = useMutation({
    mutationFn: () => api.patch(`/applications/${id}/shortlist`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', id] }),
  });

  const triggerScore = useMutation({
    mutationFn: () => api.post(`/applications/${id}/score`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['application', id] }),
  });

  const submitReview = useMutation({
    mutationFn: (notes: string) => api.put(`/applications/${id}/review`, { reviewNotes: notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['application', id] });
      setShowReview(false);
      setReviewNote('');
    },
  });

  if (isLoading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="card p-6 animate-pulse h-24 bg-slate-100" />)}
    </div>
  );
  if (!data) return <div className="card p-8 text-center text-slate-400">Application not found</div>;

  const app = data;
  const candidate = app.candidate as any;
  const job = app.job as any;
  const score = app.aiScore;
  const profile = candidate?.parsedProfile || {};

  return (
    <div className="max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-secondary p-2">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">{candidate?.name}</h1>
            <p className="text-sm text-slate-500">Applying for <span className="font-medium text-slate-700">{job?.title}</span> · {job?.department}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => toggleShortlist.mutate()}
            className={cn('btn-secondary gap-2', app.isShortlisted && 'text-amber-600 border-amber-200 bg-amber-50')}>
            {app.isShortlisted ? <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> : <StarOff className="w-4 h-4" />}
            {app.isShortlisted ? 'Shortlisted' : 'Shortlist'}
          </button>
          <button onClick={() => setShowSchedule(true)} className="btn-primary">
            <Calendar className="w-4 h-4" /> Schedule Interview
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Candidate Card */}
          <div className="card p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl mb-2">
                {candidate?.name?.[0]?.toUpperCase()}
              </div>
              <h2 className="font-bold text-slate-900">{candidate?.name}</h2>
              <p className="text-xs text-slate-500">{candidate?.email}</p>
              {candidate?.location && <p className="text-xs text-slate-400 mt-1">{candidate.location}</p>}
            </div>
            <Link href={`/candidates/${candidate?._id}`}
              className="btn-secondary w-full justify-center text-xs">
              <User className="w-3.5 h-3.5" /> View Full Profile
            </Link>
            {candidate?.resumeUrl && (
              <a href={`${process.env.NEXT_PUBLIC_URL}${candidate.resumeUrl}`} target="_blank" rel="noreferrer"
                className="btn-secondary w-full justify-center text-xs mt-2">
                <FileText className="w-3.5 h-3.5" /> Download Resume
              </a>
            )}
          </div>

          {/* Pipeline Stage */}
          <div className="card p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Pipeline Stage</h3>
            <select
              value={app.stage}
              onChange={(e) => updateStage.mutate({ stage: e.target.value })}
              className={cn('input text-sm font-medium', STAGE_COLORS[app.stage])}
              disabled={updateStage.isPending}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_LABELS[s]}</option>
              ))}
            </select>

            {/* Stage History */}
            {app.stageHistory?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-500 font-medium">History</p>
                {app.stageHistory.slice().reverse().slice(0, 5).map((h: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-medium text-slate-700 capitalize">{h.stage}</span>
                      {h.note && <span className="text-slate-400"> — {h.note}</span>}
                      <p className="text-slate-400">{formatDate(h.changedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="card p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Applied</span>
              <span className="font-medium text-slate-800">{formatDate(app.appliedAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Experience</span>
              <span className="font-medium">{profile.totalExperience ?? '—'} yrs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Source</span>
              <span className="badge badge-slate capitalize">{candidate?.source}</span>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* AI Score Panel */}
          <div className={cn('card p-5', score ? getScoreBg(score.overall) : 'border-dashed')}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500" /> AI Assessment
              </h3>
              {!score && (
                <button onClick={() => triggerScore.mutate()} disabled={triggerScore.isPending}
                  className="btn-primary text-xs px-3 py-1.5">
                  {triggerScore.isPending
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Scoring…</>
                    : <><Zap className="w-3.5 h-3.5" /> Generate Score</>}
                </button>
              )}
              {score && (
                <button onClick={() => triggerScore.mutate()} disabled={triggerScore.isPending}
                  className="text-xs text-indigo-600 hover:underline">
                  {triggerScore.isPending ? 'Re-scoring…' : 'Re-score'}
                </button>
              )}
            </div>

            {score ? (
              <div className="space-y-4">
                {/* Overall Score */}
                <div className="flex items-center gap-5">
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                      <circle cx="40" cy="40" r="32" fill="none"
                        stroke={score.overall >= 80 ? '#10b981' : score.overall >= 60 ? '#f59e0b' : '#ef4444'}
                        strokeWidth="8"
                        strokeDasharray={`${(score.overall / 100) * 201} 201`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={cn('text-xl font-bold', getScoreColor(score.overall))}>{score.overall}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className={cn('inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-semibold mb-2',
                      score.overall >= 80 ? 'bg-emerald-100 text-emerald-700'
                        : score.overall >= 60 ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700')}>
                      <Award className="w-3.5 h-3.5" />
                      {RECOMMENDATION_LABELS[score.recommendation] || score.recommendation}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{score.explanation}</p>
                  </div>
                </div>

                {/* Score Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Skill Match', value: score.skillMatch, icon: Target },
                    { label: 'Experience', value: score.experienceMatch, icon: Briefcase },
                    { label: 'Education', value: score.educationMatch, icon: TrendingUp },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-white/70 rounded-lg p-3 text-center border border-white">
                      <Icon className="w-4 h-4 mx-auto mb-1 text-slate-400" />
                      <p className={cn('text-lg font-bold', getScoreColor(value))}>{value}</p>
                      <p className="text-xs text-slate-500">{label}</p>
                      <div className="w-full bg-slate-200 rounded-full h-1 mt-2">
                        <div className="h-1 rounded-full bg-indigo-500" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Matched / Missing Skills */}
                <div className="grid grid-cols-2 gap-4">
                  {score.matchedSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-emerald-700 mb-2 flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Matched Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {score.matchedSkills.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {score.missingSkills?.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-2 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Missing Skills
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {score.missingSkills.map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 text-xs rounded-full">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <Zap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No AI score yet</p>
                <p className="text-xs text-slate-400 mt-1">Click "Generate Score" to get an AI-powered assessment</p>
              </div>
            )}
          </div>

          {/* Skills from profile */}
          {profile.skills?.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-3">Candidate Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s: string) => (
                  <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-100">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {app.coverLetter && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" /> Cover Letter
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
            </div>
          )}

          {/* Recruiter Notes */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-400" /> Recruiter Notes
              </h3>
              <button onClick={() => setShowReview(!showReview)} className="text-xs text-indigo-600 hover:underline">
                {showReview ? 'Cancel' : app.reviewNotes ? 'Edit' : 'Add Note'}
              </button>
            </div>
            {showReview ? (
              <div className="space-y-2">
                <textarea className="input text-sm resize-none" rows={3}
                  placeholder="Add your observations about this candidate..."
                  value={reviewNote || app.reviewNotes || ''}
                  onChange={(e) => setReviewNote(e.target.value)} />
                <button onClick={() => submitReview.mutate(reviewNote)}
                  disabled={submitReview.isPending}
                  className="btn-primary text-xs px-3 py-1.5">
                  {submitReview.isPending ? 'Saving…' : 'Save Note'}
                </button>
              </div>
            ) : app.reviewNotes ? (
              <p className="text-sm text-slate-600">{app.reviewNotes}</p>
            ) : (
              <p className="text-sm text-slate-400">No notes yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      {showSchedule && (
        <ScheduleInterviewModal
          applicationId={id}
          candidateName={candidate?.name}
          jobTitle={job?.title}
          jobId={job?._id}
          candidateId={candidate?._id}
          onClose={() => setShowSchedule(false)}
          onSuccess={() => { setShowSchedule(false); }}
        />
      )}
    </div>
  );
}