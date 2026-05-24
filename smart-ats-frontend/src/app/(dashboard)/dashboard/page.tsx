'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { BarChart2, Briefcase, Users, FileText, TrendingUp, Calendar, Star, Award } from 'lucide-react';
import { getScoreColor } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar,
} from 'recharts';

export default function DashboardPage() {
  const { data: overview, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: () => api.get('/analytics/overview').then((r) => r.data.kpis),
  });

  const { data: pipeline } = useQuery({
    queryKey: ['analytics-pipeline'],
    queryFn: () => api.get('/analytics/pipeline').then((r) => r.data.pipeline),
  });

  const { data: overTime } = useQuery({
    queryKey: ['analytics-over-time'],
    queryFn: () => api.get('/analytics/applications-over-time').then((r) => r.data.data),
  });

  const { data: topJobs } = useQuery({
    queryKey: ['analytics-top-jobs'],
    queryFn: () => api.get('/analytics/top-jobs').then((r) => r.data.jobs),
  });

  const kpis = [
    { label: 'Open Jobs', value: overview?.openJobs ?? '-', icon: Briefcase, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Total Candidates', value: overview?.totalCandidates ?? '-', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Applications', value: overview?.totalApplications ?? '-', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Interviews (30d)', value: overview?.interviews ?? '-', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Shortlisted', value: overview?.shortlisted ?? '-', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Hired', value: overview?.hired ?? '-', icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Conversion Rate', value: `${overview?.conversionRate ?? 0}%`, icon: TrendingUp, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: 'App Growth (30d)', value: `${overview?.applicationGrowth ?? 0}%`, icon: BarChart2, color: 'text-sky-600', bg: 'bg-sky-50' },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card p-5 h-28 animate-pulse bg-slate-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Applications over time */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Applications Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={overTime || []}>
              <defs>
                <linearGradient id="appGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#appGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline funnel */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Pipeline Funnel</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={pipeline || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} tickLine={false} width={70} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Jobs */}
      {topJobs && topJobs.length > 0 && (
        <div className="card p-5">
          <h3 className="section-title mb-4">Top Jobs by Applications</h3>
          <div className="space-y-3">
            {topJobs.slice(0, 5).map((job: any) => (
              <div key={job._id} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{job.title}</p>
                  <p className="text-xs text-slate-500">{job.department}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full"
                      style={{ width: `${Math.min((job.totalApplications / (topJobs[0]?.totalApplications || 1)) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-8 text-right">{job.totalApplications}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
