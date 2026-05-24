'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Candidate } from '@/types';
import { X, Search, Loader2, User, Mail, Briefcase, CheckCircle2 } from 'lucide-react';

interface Props {
  jobId: string;
  jobTitle: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApplyCandidateModal({ jobId, jobTitle, onClose, onSuccess }: Props) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [coverLetter, setCoverLetter] = useState('');

  // Fetch candidates — filter by search term
  const { data, isLoading } = useQuery({
    queryKey: ['candidates-picker', search],
    queryFn: () =>
      api
        .get('/candidates', {
          params: { search: search || undefined, limit: 30 },
        })
        .then((r) => r.data),
    // Debounce: only fire when search changes (React Query deduplicates anyway)
  });

  const candidates: Candidate[] = data?.candidates || [];

  const apply = useMutation({
    mutationFn: () =>
      api.post('/applications', {
        job: jobId,
        candidate: selectedCandidate!._id,
        coverLetter: coverLetter.trim() || undefined,
      }),
    onSuccess: () => {
      toast.success(`${selectedCandidate!.name} applied to "${jobTitle}"!`);
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['job', jobId] });
      onSuccess();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Failed to submit application';
      toast.error(msg);
    },
  });

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Apply Candidate to Job</h2>
            <p className="text-sm text-slate-500 mt-0.5 truncate max-w-xs">{jobTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-4 p-5 overflow-y-auto">

          {/* Step 1: Pick candidate */}
          <div>
            <label className="label">Search & Select Candidate *</label>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="input pl-9"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSelectedCandidate(null); // reset selection on new search
                }}
              />
            </div>

            {/* Candidate list */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                </div>
              ) : candidates.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">
                  {search ? 'No candidates match your search.' : 'No candidates found. Add some first!'}
                </div>
              ) : (
                <ul className="divide-y divide-slate-50">
                  {candidates.map((c) => {
                    const isSelected = selectedCandidate?._id === c._id;
                    return (
                      <li key={c._id}>
                        <button
                          type="button"
                          onClick={() => setSelectedCandidate(isSelected ? null : c)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? 'bg-indigo-50 border-l-2 border-indigo-500'
                              : 'hover:bg-slate-50 border-l-2 border-transparent'
                          }`}
                        >
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                            {c.name[0].toUpperCase()}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{c.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 truncate">
                              <Mail className="w-3 h-3 shrink-0" /> {c.email}
                            </p>
                            {(c.parsedProfile?.skills?.length ?? 0) > 0 && (
                              <div className="flex gap-1 mt-1 flex-wrap">
                                {c.parsedProfile!.skills.slice(0, 3).map((s) => (
                                  <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                                    {s}
                                  </span>
                                ))}
                                {c.parsedProfile!.skills.length > 3 && (
                                  <span className="text-xs text-slate-400">+{c.parsedProfile!.skills.length - 3}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Checkmark */}
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Selected candidate summary */}
          {selectedCandidate && (
            <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {selectedCandidate.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{selectedCandidate.name}</p>
                <p className="text-xs text-slate-500">{selectedCandidate.email}</p>
              </div>
              <span className="text-xs text-indigo-600 font-medium bg-indigo-100 px-2 py-0.5 rounded-full">
                Selected
              </span>
            </div>
          )}

          {/* Step 2: Optional cover letter */}
          <div>
            <label className="label">
              Cover Letter / Notes{' '}
              <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              className="input min-h-24 resize-y text-sm"
              placeholder="Add a note about why this candidate is a good fit..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
            />
          </div>

          {/* Info note */}
          <p className="text-xs text-slate-400 flex items-start gap-1.5">
            <Briefcase className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            AI scoring will run automatically after submission. The candidate will appear in the Applications pipeline.
          </p>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-slate-100 shrink-0">
          <button
            className="btn-primary flex-1 justify-center"
            onClick={() => apply.mutate()}
            disabled={!selectedCandidate || apply.isPending}
          >
            {apply.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                <User className="w-4 h-4" /> Submit Application
              </>
            )}
          </button>
          <button className="btn-secondary" onClick={onClose} disabled={apply.isPending}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}