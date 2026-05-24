'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, Mail, Phone, MapPin, Linkedin, Github, Globe, FileText, Clock, Briefcase } from 'lucide-react';
import { formatDate, STAGE_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function CandidateDetailPage() {
  const { id } = useParams();

  const { data, isLoading } = useQuery({
    queryKey: ['candidate', id],
    queryFn: () => api.get(`/candidates/${id}`).then((r) => r.data.candidate),
  });

  const { data: appsData } = useQuery({
    queryKey: ['candidate-applications', id],
    queryFn: () => api.get(`/candidates/${id}/applications`).then((r) => r.data.applications),
  });

  if (isLoading) return <div className="card p-8 animate-pulse h-96" />;
  if (!data) return <div className="card p-8 text-center text-slate-400">Candidate not found</div>;

  const c = data;
  const profile = c.parsedProfile || {};

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/candidates" className="btn-secondary p-2"><ArrowLeft className="w-4 h-4" /></Link>
        <h1 className="page-title">{c.name}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left - Profile */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-2xl mb-3">
                {c.name[0].toUpperCase()}
              </div>
              <h2 className="text-lg font-bold text-slate-900">{c.name}</h2>
              {profile.summary && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{profile.summary}</p>}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Mail className="w-3.5 h-3.5 text-slate-400" />{c.email}</div>
              {c.phone && <div className="flex items-center gap-2 text-slate-600"><Phone className="w-3.5 h-3.5 text-slate-400" />{c.phone}</div>}
              {c.location && <div className="flex items-center gap-2 text-slate-600"><MapPin className="w-3.5 h-3.5 text-slate-400" />{c.location}</div>}
              {c.linkedIn && <a href={c.linkedIn} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline"><Linkedin className="w-3.5 h-3.5" />LinkedIn</a>}
              {c.github && <a href={c.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline"><Github className="w-3.5 h-3.5" />GitHub</a>}
              {c.portfolio && <a href={c.portfolio} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-indigo-600 hover:underline"><Globe className="w-3.5 h-3.5" />Portfolio</a>}
            </div>

            {c.resumeUrl && (
              <a href={`${process.env.NEXT_PUBLIC_URL}${c.resumeUrl}`} target="_blank" rel="noreferrer"
                className="btn-secondary w-full justify-center mt-4 text-xs">
                <FileText className="w-3.5 h-3.5" /> View Resume
              </a>
            )}
          </div>

          {/* Stats */}
          <div className="card p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Experience</span>
              <span className="font-medium text-slate-800">{profile.totalExperience ?? 0} years</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Source</span>
              <span className="badge badge-slate capitalize">{c.source}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Added</span>
              <span className="font-medium text-slate-800">{formatDate(c.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* Right - Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-3">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((s: string) => (
                  <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-sm rounded-lg border border-indigo-100">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {profile.experience?.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" />Experience</h3>
              <div className="space-y-4">
                {profile.experience.map((exp: any, i: number) => (
                  <div key={i} className="border-l-2 border-indigo-200 pl-4">
                    <p className="text-sm font-semibold text-slate-900">{exp.title}</p>
                    <p className="text-sm text-slate-600">{exp.company}</p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Clock className="w-3 h-3" />{exp.duration}</p>
                    {exp.description && <p className="text-xs text-slate-500 mt-1">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {profile.education?.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-3">Education</h3>
              <div className="space-y-3">
                {profile.education.map((edu: any, i: number) => (
                  <div key={i} className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{edu.degree} in {edu.field}</p>
                      <p className="text-xs text-slate-500">{edu.institution}</p>
                    </div>
                    <span className="text-xs text-slate-400">{edu.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {appsData && appsData.length > 0 && (
            <div className="card p-5">
              <h3 className="section-title mb-3">Applications</h3>
              <div className="space-y-2">
                {appsData.map((app: any) => (
                  <div key={app._id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{app.job?.title}</p>
                      <p className="text-xs text-slate-500">{app.job?.department}</p>
                    </div>
                    <span className={cn('badge', STAGE_COLORS[app.stage])}>{app.stage}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
