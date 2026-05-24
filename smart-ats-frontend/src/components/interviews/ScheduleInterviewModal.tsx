'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { X, Calendar, Clock, Video, Phone, MapPin, Users, Link2, Loader2 } from 'lucide-react';

interface Props {
  applicationId: string;
  candidateName: string;
  jobTitle: string;
  jobId: string;
  candidateId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const INTERVIEW_TYPES = [
  { value: 'phone_screen', label: 'Phone Screen' },
  { value: 'technical', label: 'Technical' },
  { value: 'hr', label: 'HR Round' },
  { value: 'final', label: 'Final Round' },
  { value: 'panel', label: 'Panel Interview' },
];

const DURATION_OPTIONS = [
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export default function ScheduleInterviewModal({
  applicationId, candidateName, jobTitle, jobId, candidateId, onClose, onSuccess,
}: Props) {
  const qc = useQueryClient();

  const { data: usersData } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get('/auth/users').then((r) => r.data.users || []),
  });

  const [form, setForm] = useState({
    type: 'technical',
    round: 1,
    scheduledAt: '',
    duration: 60,
    mode: 'video' as 'video' | 'phone' | 'in_person',
    meetingLink: '',
    location: '',
    interviewers: [] as string[],
    notes: '',
  });

  const schedule = useMutation({
    mutationFn: (payload: any) => api.post('/interviews', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['interviews'] });
      onSuccess();
    },
  });

  const toggleInterviewer = (id: string) => {
    setForm((f) => ({
      ...f,
      interviewers: f.interviewers.includes(id)
        ? f.interviewers.filter((i) => i !== id)
        : [...f.interviewers, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.scheduledAt) return;

    schedule.mutate({
      application: applicationId,
      job: jobId,
      candidate: candidateId,
      ...form,
      scheduledAt: new Date(form.scheduledAt).toISOString(),
    });
  };

  // Get tomorrow as min date
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().slice(0, 16);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Schedule Interview</h2>
            <p className="text-sm text-slate-500 mt-0.5">{candidateName} · {jobTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type & Round */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Interview Type</label>
              <select className="input" value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {INTERVIEW_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Round</label>
              <input type="number" min={1} max={10} className="input"
                value={form.round}
                onChange={(e) => setForm({ ...form, round: parseInt(e.target.value) })} />
            </div>
          </div>

          {/* Date & Time */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date & Time
            </label>
            <input type="datetime-local" className="input" min={minDate}
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
              required />
          </div>

          {/* Duration */}
          <div>
            <label className="label flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" /> Duration
            </label>
            <select className="input" value={form.duration}
              onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}>
              {DURATION_OPTIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Mode */}
          <div>
            <label className="label">Mode</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'video', label: 'Video', icon: Video },
                { value: 'phone', label: 'Phone', icon: Phone },
                { value: 'in_person', label: 'In Person', icon: MapPin },
              ].map(({ value, label, icon: Icon }) => (
                <button key={value} type="button"
                  onClick={() => setForm({ ...form, mode: value as any })}
                  className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    form.mode === value
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Meeting Link or Location */}
          {form.mode === 'video' && (
            <div>
              <label className="label flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-slate-400" /> Meeting Link
              </label>
              <input type="url" className="input" placeholder="https://meet.google.com/..."
                value={form.meetingLink}
                onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} />
            </div>
          )}
          {form.mode === 'in_person' && (
            <div>
              <label className="label flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
              </label>
              <input type="text" className="input" placeholder="Office address or room number"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} />
            </div>
          )}

          {/* Interviewers */}
          {usersData && usersData.length > 0 && (
            <div>
              <label className="label flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" /> Interviewers
              </label>
              <div className="space-y-1.5 max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2">
                {usersData.map((u: any) => (
                  <label key={u._id} className="flex items-center gap-2.5 cursor-pointer p-1.5 hover:bg-slate-50 rounded-lg">
                    <input type="checkbox"
                      checked={form.interviewers.includes(u._id)}
                      onChange={() => toggleInterviewer(u._id)}
                      className="rounded border-slate-300 text-indigo-600" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                      {u.name[0].toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-700">{u.name}</span>
                    <span className="text-xs text-slate-400 capitalize ml-auto">{u.role}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {schedule.isError && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {(schedule.error as any)?.response?.data?.error || 'Failed to schedule interview'}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center">
              Cancel
            </button>
            <button type="submit" disabled={schedule.isPending || !form.scheduledAt}
              className="btn-primary flex-1 justify-center">
              {schedule.isPending
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Scheduling…</>
                : <><Calendar className="w-4 h-4" /> Schedule & Notify</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}