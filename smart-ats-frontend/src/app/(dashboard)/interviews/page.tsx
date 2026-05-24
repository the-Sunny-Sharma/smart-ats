'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Interview } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import {
  Calendar, Video, Phone, MapPin, Clock, Users, CheckCircle,
  XCircle, AlertCircle, Star, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  rescheduled: 'bg-amber-50 text-amber-700 border-amber-200',
  no_show: 'bg-slate-100 text-slate-600 border-slate-200',
};

const MODE_ICONS: Record<string, any> = {
  video: Video,
  phone: Phone,
  in_person: MapPin,
};

function FeedbackForm({ interview, onClose }: { interview: Interview; onClose: () => void }) {
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState({
    rating: 3,
    notes: '',
    recommendation: 'maybe' as 'hire' | 'no_hire' | 'maybe' | 'next_round',
  });

  const submit = useMutation({
    mutationFn: (data: any) => api.post(`/interviews/${interview._id}/feedback`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interviews'] }); onClose(); },
  });

  return (
    <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
      <h4 className="text-sm font-semibold text-slate-800">Submit Feedback</h4>

      {/* Rating */}
      <div>
        <label className="label text-xs">Overall Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setFeedback({ ...feedback, rating: n })}>
              <Star className={cn('w-6 h-6 transition-colors', n <= feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation */}
      <div>
        <label className="label text-xs">Recommendation</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'hire', label: '✅ Hire', color: 'emerald' },
            { value: 'no_hire', label: '❌ No Hire', color: 'red' },
            { value: 'next_round', label: '➡️ Next Round', color: 'blue' },
            { value: 'maybe', label: '🤔 Maybe', color: 'amber' },
          ].map(({ value, label }) => (
            <button key={value} type="button"
              onClick={() => setFeedback({ ...feedback, recommendation: value as any })}
              className={cn(
                'p-2 text-xs font-medium rounded-lg border transition-colors',
                feedback.recommendation === value
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'border-slate-200 text-slate-600 hover:bg-white'
              )}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="label text-xs">Feedback Notes</label>
        <textarea className="input text-sm resize-none" rows={3}
          placeholder="Candidate strengths, areas of concern, technical assessment..."
          value={feedback.notes}
          onChange={(e) => setFeedback({ ...feedback, notes: e.target.value })} />
      </div>

      <div className="flex gap-2">
        <button onClick={onClose} className="btn-secondary text-xs flex-1 justify-center py-1.5">Cancel</button>
        <button onClick={() => submit.mutate(feedback)} disabled={submit.isPending}
          className="btn-primary text-xs flex-1 justify-center py-1.5">
          {submit.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
}

function InterviewCard({ interview }: { interview: Interview }) {
  const qc = useQueryClient();
  const [showFeedback, setShowFeedback] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const candidate = interview.candidate as any;
  const job = interview.job as any;
  const ModeIcon = MODE_ICONS[interview.mode] || Video;

  const updateStatus = useMutation({
    mutationFn: (status: string) => api.patch(`/interviews/${interview._id}/status`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['interviews'] }),
  });

  const isPast = new Date(interview.scheduledAt) < new Date();

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold shrink-0">
            {candidate?.name?.[0]?.toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link href={`/candidates/${candidate?._id}`} className="font-semibold text-slate-900 hover:text-indigo-600">
                {candidate?.name}
              </Link>
              <span className={cn('badge border text-xs', STATUS_COLORS[interview.status])}>
                {interview.status.replace('_', ' ')}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">{job?.title} · {job?.department}</p>

            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(interview.scheduledAt).toLocaleDateString('en-IN', {
                  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />{interview.duration} min
              </span>
              <span className="flex items-center gap-1">
                <ModeIcon className="w-3.5 h-3.5" />
                {interview.mode.replace('_', ' ')}
              </span>
              <span className="capitalize bg-slate-100 px-2 py-0.5 rounded-full">
                Round {interview.round} · {interview.type.replace('_', ' ')}
              </span>
            </div>

            {interview.meetingLink && (
              <a href={interview.meetingLink} target="_blank" rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1.5">
                <Video className="w-3 h-3" /> Join Meeting
              </a>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {interview.status === 'scheduled' && isPast && !interview.feedback && (
            <button onClick={() => setShowFeedback(!showFeedback)}
              className="btn-primary text-xs px-3 py-1.5">
              Feedback
            </button>
          )}
          {interview.status === 'scheduled' && (
            <div className="flex gap-1">
              <button onClick={() => updateStatus.mutate('completed')}
                disabled={updateStatus.isPending}
                title="Mark completed"
                className="p-1.5 hover:bg-emerald-50 text-emerald-600 rounded-lg border border-transparent hover:border-emerald-200 transition-colors">
                <CheckCircle className="w-4 h-4" />
              </button>
              <button onClick={() => updateStatus.mutate('cancelled')}
                disabled={updateStatus.isPending}
                title="Cancel"
                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg border border-transparent hover:border-red-200 transition-colors">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded: feedback display */}
      {expanded && interview.feedback && (
        <div className="mt-4 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
          <h4 className="text-sm font-semibold text-emerald-800 mb-2">Interview Feedback</h4>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={cn('w-4 h-4', n <= interview.feedback!.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300')} />
            ))}
            <span className="text-xs text-slate-600 ml-2 capitalize">{interview.feedback.recommendation.replace('_', ' ')}</span>
          </div>
          {interview.feedback.notes && (
            <p className="text-sm text-slate-700">{interview.feedback.notes}</p>
          )}
        </div>
      )}

      {/* Feedback form */}
      {showFeedback && (
        <FeedbackForm interview={interview} onClose={() => setShowFeedback(false)} />
      )}
    </div>
  );
}

export default function InterviewsPage() {
  const [status, setStatus] = useState('');
  const [view, setView] = useState<'upcoming' | 'all'>('upcoming');

  const { data, isLoading } = useQuery({
    queryKey: ['interviews', status, view],
    queryFn: () =>
      api.get('/interviews', {
        params: {
          status: status || undefined,
          upcoming: view === 'upcoming' ? 'true' : undefined,
          limit: 50,
        },
      }).then((r) => r.data),
  });

  const interviews: Interview[] = data?.interviews || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Interviews</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total ?? 0} total interviews</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
          {(['upcoming', 'all'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={cn('px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize', view === v
                ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
              {v}
            </button>
          ))}
        </div>
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse h-24 bg-slate-100" />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <div className="card p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No interviews found.</p>
          <p className="text-slate-400 text-xs mt-1">
            Schedule interviews from the application detail page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((iv) => <InterviewCard key={iv._id} interview={iv} />)}
        </div>
      )}
    </div>
  );
}