'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { X, Loader2, Upload } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCandidateModal({ onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<'manual' | 'upload'>('manual');
  const [form, setForm] = useState({ name: '', email: '', phone: '', location: '', source: 'manual' });
  const [file, setFile] = useState<File | null>(null);

  const createManual = useMutation({
    mutationFn: () => api.post('/candidates', form),
    onSuccess: () => { toast.success('Candidate added!'); onSuccess(); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Failed'),
  });

  const uploadResume = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('resume', file!);
      fd.append('name', form.name);
      fd.append('email', form.email);
      return api.post('/candidates/upload-resume', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => { toast.success('Resume uploaded & parsing started!'); onSuccess(); },
    onError: (err: any) => toast.error(err?.response?.data?.error || 'Upload failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tab === 'manual') createManual.mutate();
    else if (file) uploadResume.mutate();
    else toast.error('Please select a file');
  };

  const loading = createManual.isPending || uploadResume.isPending;

  return (
<div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-start justify-center z-50 p-4 pt-2">      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add Candidate</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          {(['manual', 'upload'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${tab === t ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
              {t === 'manual' ? 'Manual Entry' : 'Upload Resume'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {tab === 'upload' && (
            <div>
              <label className="label">Resume File (PDF, DOC, DOCX)</label>
              <div
                onClick={() => document.getElementById('resume-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors
                  ${file ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
              >
                <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <p className="text-sm text-slate-600">{file ? file.name : 'Click to upload resume'}</p>
                <p className="text-xs text-slate-400 mt-1">PDF, DOC, DOCX up to 5MB</p>
                <input id="resume-input" type="file" accept=".pdf,.doc,.docx" className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] || null)} />
              </div>
            </div>
          )}

          <div>
            <label className="label">Full Name *</label>
            <input className="input" placeholder="Jane Smith" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email *</label>
            <input type="email" className="input" placeholder="jane@email.com" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          {tab === 'manual' && (
            <>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+91 9999999999" value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="Mumbai, India" value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div>
                <label className="label">Source</label>
                <select className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                  <option value="manual">Manual</option>
                  <option value="referral">Referral</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Saving...' : 'Add Candidate'}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
