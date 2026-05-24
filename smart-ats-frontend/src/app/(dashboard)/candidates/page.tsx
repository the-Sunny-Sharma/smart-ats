'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { Candidate } from '@/types';
import { cn, formatDate, timeAgo } from '@/lib/utils';
import { Plus, Search, Mail, Phone, MapPin, ExternalLink, Upload } from 'lucide-react';
import AddCandidateModal from '@/components/candidates/AddCandidateModal';

export default function CandidatesPage() {
  const [search, setSearch] = useState('');
  const [source, setSource] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['candidates', search, source],
    queryFn: () =>
      api.get('/candidates', { params: { search: search || undefined, source: source || undefined, limit: 50 } })
        .then((r) => r.data),
  });

  const candidates: Candidate[] = data?.candidates || [];

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Candidates</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total ?? 0} total candidates</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAdd(true)}>
          <Plus className="w-4 h-4" /> Add Candidate
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input className="input pl-9" placeholder="Search candidates..." value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="input w-40" value={source} onChange={(e) => setSource(e.target.value)}>
          <option value="">All Sources</option>
          <option value="upload">Upload</option>
          <option value="manual">Manual</option>
          <option value="referral">Referral</option>
          <option value="linkedin">LinkedIn</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-sm">Loading...</div>
        ) : candidates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm">No candidates yet. Add your first one!</p>
            <button className="btn-primary mt-4" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4" /> Add Candidate
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-slate-100 bg-slate-50">
              <tr>
                <th className="text-left table-header px-5 py-3">Candidate</th>
                <th className="text-left table-header px-4 py-3 hidden md:table-cell">Skills</th>
                <th className="text-left table-header px-4 py-3 hidden lg:table-cell">Experience</th>
                <th className="text-left table-header px-4 py-3 hidden md:table-cell">Source</th>
                <th className="text-left table-header px-4 py-3">Added</th>
                <th className="table-header px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {candidates.map((c) => (
                <tr key={c._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        {c.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {c.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {(c.parsedProfile?.skills || []).slice(0, 3).map((s) => (
                        <span key={s} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{s}</span>
                      ))}
                      {(c.parsedProfile?.skills?.length || 0) > 3 && (
                        <span className="text-xs text-slate-400">+{(c.parsedProfile?.skills?.length || 0) - 3}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-sm text-slate-600">
                      {c.parsedProfile?.totalExperience ? `${c.parsedProfile.totalExperience} yrs` : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className="badge badge-slate capitalize">{c.source}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs text-slate-500">{timeAgo(c.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link href={`/candidates/${c._id}`} className="text-xs text-indigo-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && <AddCandidateModal onClose={() => setShowAdd(false)} onSuccess={() => { refetch(); setShowAdd(false); }} />}
    </div>
  );
}
