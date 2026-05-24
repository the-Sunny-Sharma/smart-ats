'use client';

import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { TrendingUp, Users, Briefcase, Award } from 'lucide-react';

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AnalyticsPage() {
  const { data: overview } = useQuery({
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

  const { data: sources } = useQuery({
    queryKey: ['analytics-sources'],
    queryFn: () => api.get('/analytics/source-breakdown').then((r) => r.data.sources),
  });

  const { data: aiScores } = useQuery({
    queryKey: ['analytics-ai-scores'],
    queryFn: () => api.get('/analytics/ai-scores').then((r) => r.data),
  });

  const SCORE_LABELS: Record<number, string> = { 0: '0-20', 20: '20-40', 40: '40-60', 60: '60-80', 80: '80-100' };

  return (
    <div className="space-y-6">
      <h1 className="page-title">Analytics</h1>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Conversion Rate', value: `${overview?.conversionRate ?? 0}%`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Total Hired', value: overview?.hired ?? 0, icon: Award, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Shortlisted', value: overview?.shortlisted ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'App Growth', value: `${overview?.applicationGrowth ?? 0}%`, icon: Briefcase, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-2`}>
              <Icon className={`w-4.5 h-4.5 ${color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Applications Over Time */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Applications Over Time (30d)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={overTime || []}>
              <defs>
                <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fill="url(#grad1)" strokeWidth={2} dot={false} name="Applications" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pipeline */}
        <div className="card p-5">
          <h3 className="section-title mb-4">Pipeline Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pipeline || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="stage" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Breakdown */}
        {sources && sources.length > 0 && (
          <div className="card p-5">
            <h3 className="section-title mb-4">Candidate Sources</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={sources} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={80} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                  {sources.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* AI Score Distribution */}
        {aiScores?.distribution && aiScores.distribution.length > 0 && (
          <div className="card p-5">
            <h3 className="section-title mb-4">AI Score Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aiScores.distribution.map((d: any) => ({ ...d, range: SCORE_LABELS[d._id] || d._id }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
