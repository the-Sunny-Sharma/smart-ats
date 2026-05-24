import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Date formatting (date-fns) ────────────────────────────────────────────
export function formatDate(date: string | Date | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
}

export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy, hh:mm a');
}

export function timeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

// ─── Stage labels and colours (direct Tailwind classes) ───────────────────
export const STAGE_LABELS: Record<string, string> = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Rejected',
};

export const STAGE_COLORS: Record<string, string> = {
  applied: 'bg-slate-100 text-slate-700',
  screening: 'bg-blue-100 text-blue-700',
  interview: 'bg-purple-100 text-purple-700',
  offer: 'bg-amber-100 text-amber-700',
  hired: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

// ─── Job status colours (from first version) ──────────────────────────────
export const JOB_STATUS_COLORS: Record<string, string> = {
  open: 'badge-green',
  draft: 'badge-slate',
  paused: 'badge-yellow',
  closed: 'badge-red',
};

// ─── AI score helpers ─────────────────────────────────────────────────────
export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600';
  if (score >= 60) return 'text-amber-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 border-amber-200';
  if (score >= 40) return 'bg-orange-50 border-orange-200';
  return 'bg-red-50 border-red-200';
}

export const RECOMMENDATION_LABELS: Record<string, string> = {
  strong_yes: '⭐ Strong Yes',
  yes: '✅ Yes',
  maybe: '🤔 Maybe',
  no: '❌ No',
};

export function truncate(str: string, n: number): string {
  if (!str) return '';
  return str.length > n ? str.slice(0, n) + '...' : str;
}