'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { Job } from '@/types';
import { cn, JOB_STATUS_COLORS, formatDate } from '@/lib/utils';
import { Plus, MapPin, Users, Clock, MoreVertical, Search, Filter } from 'lucide-react';

export default function JobsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', search, status],
    queryFn: () =>
      api.get('/jobs', { params: { search: search || undefined, status: status || undefined, limit: 50 } })
        .then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/jobs/${id}/status`, { status }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); toast.success('Status updated'); },
  });

  const jobs: Job[] = data?.jobs || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Jobs</h1>
          <p className="text-sm text-slate-500 mt-0.5">{data?.total ?? 0} total positions</p>
        </div>
        <Link href="/jobs/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          Post Job
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="draft">Draft</option>
          <option value="paused">Paused</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Jobs grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-5 h-48 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-400 text-sm">No jobs found. Post your first job!</p>
          <Link href="/jobs/new" className="btn-primary mt-4 inline-flex">
            <Plus className="w-4 h-4" /> Post Job
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div key={job._id} className="card p-5 hover:shadow-card-hover transition-shadow group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <Link href={`/jobs/${job._id}`} className="text-base font-semibold text-slate-900 hover:text-indigo-600 transition-colors line-clamp-1">
                    {job.title}
                  </Link>
                  <p className="text-sm text-slate-500">{job.department}</p>
                </div>
                <span className={cn('badge ml-2 shrink-0', JOB_STATUS_COLORS[job.status])}>
                  {job.status}
                </span>
              </div>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {job.location} · {job.locationType}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className="w-3.5 h-3.5" />
                  {job.type} · {job.experienceMin}-{job.experienceMax} yrs
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Users className="w-3.5 h-3.5" />
                  {job.totalApplications} applications
                </div>
              </div>

              {/* Skills */}
              {job.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {job.skills.slice(0, 3).map((skill) => (
                    <span key={skill} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-md">
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 3 && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-md">
                      +{job.skills.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{formatDate(job.createdAt)}</span>
                <div className="flex gap-2">
                  <Link href={`/applications?jobId=${job._id}`} className="text-xs text-indigo-600 hover:underline">
                    View apps
                  </Link>
                  <Link href={`/jobs/${job._id}`} className="text-xs text-slate-500 hover:text-slate-700">
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
