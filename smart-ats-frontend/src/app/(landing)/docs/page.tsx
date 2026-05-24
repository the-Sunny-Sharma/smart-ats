'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, ChevronDown } from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://your-api-domain.com/api';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
type AuthLevel = 'public' | 'auth' | 'admin' | 'webhook' | 'internal';

interface Param {
  name: string;
  type: string;
  required?: boolean;
  default?: string;
  desc: string;
}

interface Endpoint {
  method: Method;
  path: string;
  summary: string;
  auth: AuthLevel;
  description?: string;
  queryParams?: Param[];
  bodyParams?: Param[];
  responseCodes?: string[];
  requestExample?: string;
  responseExample?: string;
  callouts?: { type: 'info' | 'warn' | 'danger' | 'ai'; text: string }[];
}

interface Section {
  id: string;
  icon: string;
  label: string;
  color: string;
  description: string;
  endpoints: Endpoint[];
}

const SECTIONS: Section[] = [
  {
    id: 'auth',
    icon: '🔐',
    label: 'Auth',
    color: 'rgba(16,185,129,0.15)',
    description: 'User registration, login, Google OAuth, profile management, and admin user controls.',
    endpoints: [
      {
        method: 'POST', path: '/auth/register', summary: 'Register a new user', auth: 'public',
        description: 'Creates a new user. First registered user becomes admin; all others default to recruiter.',
        bodyParams: [
          { name: 'name', type: 'string', required: true, desc: 'Full name' },
          { name: 'email', type: 'string', required: true, desc: 'Unique email address' },
          { name: 'password', type: 'string', required: true, desc: 'Min 6 characters' },
        ],
        requestExample: `{ "name": "Priya Sharma", "email": "priya@co.com", "password": "secure123" }`,
        responseExample: `{ "token": "eyJhbGci...", "user": { "_id": "...", "role": "recruiter", "isPremium": false } }`,
        responseCodes: ['201 Created', '400 Validation', '409 Email taken'],
      },
      {
        method: 'POST', path: '/auth/login', summary: 'Authenticate user', auth: 'public',
        bodyParams: [
          { name: 'email', type: 'string', required: true, desc: 'Registered email' },
          { name: 'password', type: 'string', required: true, desc: 'Account password' },
        ],
        responseCodes: ['200 OK — token + user', '401 Invalid credentials'],
      },
      {
        method: 'POST', path: '/auth/google', summary: 'Google OAuth login / signup', auth: 'public',
        description: 'Creates or links a Google account. If email already exists with local provider, Google ID is linked.',
        bodyParams: [
          { name: 'email', type: 'string', required: true, desc: 'Google account email' },
          { name: 'name', type: 'string', required: false, desc: 'Display name' },
          { name: 'googleId', type: 'string', required: false, desc: 'Google sub ID' },
          { name: 'image', type: 'string', required: false, desc: 'Avatar URL' },
        ],
        responseCodes: ['200 OK — token + user', '400 Email required'],
      },
      {
        method: 'GET', path: '/auth/me', summary: 'Get current user', auth: 'auth',
        responseCodes: ['200 OK — { user }', '401 Unauthorized'],
      },
      {
        method: 'PUT', path: '/auth/me', summary: 'Update profile', auth: 'auth',
        bodyParams: [
          { name: 'name', type: 'string', required: false, desc: 'Updated display name' },
          { name: 'avatar', type: 'string', required: false, desc: 'Avatar URL' },
          { name: 'preferences', type: 'object', required: false, desc: '{ emailNotifications: boolean, timezone: string }' },
        ],
        responseCodes: ['200 OK — { user }'],
      },
      {
        method: 'GET', path: '/auth/users', summary: 'List all users', auth: 'auth',
        responseCodes: ['200 OK — { users: [] }'],
      },
      {
        method: 'PATCH', path: '/auth/users/:userId/role', summary: 'Change user role', auth: 'admin',
        callouts: [{ type: 'warn', text: 'An admin cannot remove their own admin role.' }],
        bodyParams: [{ name: 'role', type: 'enum', required: true, desc: 'admin · recruiter · hiring_manager' }],
        responseCodes: ['200 OK', '400 Invalid role', '403 Forbidden'],
      },
      {
        method: 'PATCH', path: '/auth/users/:userId/status', summary: 'Activate / deactivate user', auth: 'admin',
        bodyParams: [{ name: 'isActive', type: 'boolean', required: true, desc: 'false = deactivate; deactivated users cannot authenticate' }],
        responseCodes: ['200 OK', '403 Forbidden'],
      },
    ],
  },
  {
    id: 'jobs',
    icon: '💼',
    label: 'Jobs',
    color: 'rgba(59,130,246,0.15)',
    description: 'Create, search, and manage job postings. Full-text search via MongoDB text index on title, description, and skills.',
    endpoints: [
      {
        method: 'GET', path: '/jobs', summary: 'List / search jobs', auth: 'auth',
        queryParams: [
          { name: 'search', type: 'string', desc: 'Full-text search on title, description, skills' },
          { name: 'status', type: 'enum', desc: 'draft · open · paused · closed' },
          { name: 'department', type: 'string', desc: 'Filter by department' },
          { name: 'locationType', type: 'enum', desc: 'remote · onsite · hybrid' },
          { name: 'type', type: 'enum', desc: 'full-time · part-time · contract · internship' },
          { name: 'page', type: 'number', default: '1', desc: 'Page number' },
          { name: 'limit', type: 'number', default: '20', desc: 'Results per page' },
          { name: 'sortBy / order', type: 'string', default: 'createdAt / desc', desc: 'Sort field and direction' },
        ],
        responseExample: `{ "jobs": [...], "total": 42, "page": 1, "pages": 3 }`,
        responseCodes: ['200 OK'],
      },
      { method: 'GET', path: '/jobs/stats', summary: 'Aggregate stats by status', auth: 'auth',
        responseExample: `{ "stats": [{ "_id": "open", "count": 12, "totalApplications": 87 }] }`,
        responseCodes: ['200 OK'] },
      { method: 'GET', path: '/jobs/:id', summary: 'Get job by ID', auth: 'auth', responseCodes: ['200 OK — { job }', '404 Not Found'] },
      {
        method: 'POST', path: '/jobs', summary: 'Create job posting', auth: 'auth',
        description: 'Requires recruiter or admin role.',
        bodyParams: [
          { name: 'title', type: 'string', required: true, desc: 'Job title' },
          { name: 'department', type: 'string', required: true, desc: 'Department name' },
          { name: 'location', type: 'string', required: true, desc: 'City or "Remote"' },
          { name: 'description', type: 'string', required: true, desc: 'Full job description' },
          { name: 'skills', type: 'string[]', required: false, desc: 'Required skills — used for AI matching' },
          { name: 'requirements', type: 'string[]', required: false, desc: 'Bullet-point requirements' },
          { name: 'experienceMin/Max', type: 'number', required: false, desc: 'Experience range in years' },
          { name: 'salaryMin/Max', type: 'number', required: false, desc: 'Salary range' },
          { name: 'deadline', type: 'date', required: false, desc: 'ISO date string' },
        ],
        responseCodes: ['201 Created — { job }', '400 Validation', '403 Forbidden'],
      },
      { method: 'PUT', path: '/jobs/:id', summary: 'Update job', auth: 'auth', responseCodes: ['200 OK — { job }', '404 Not Found'] },
      { method: 'PATCH', path: '/jobs/:id/status', summary: 'Update job status', auth: 'auth',
        bodyParams: [{ name: 'status', type: 'enum', required: true, desc: 'draft · open · paused · closed' }],
        responseCodes: ['200 OK', '404 Not Found'] },
      { method: 'DELETE', path: '/jobs/:id', summary: 'Delete job', auth: 'admin', responseCodes: ['200 OK', '403 Admin only', '404 Not Found'] },
    ],
  },
  {
    id: 'candidates',
    icon: '🧑‍💼',
    label: 'Candidates',
    color: 'rgba(245,158,11,0.15)',
    description: 'Manage candidate profiles. Resume uploads trigger AI parsing. Duplicate detection uses MD5 fingerprint of name + email.',
    endpoints: [
      {
        method: 'GET', path: '/candidates', summary: 'List candidates', auth: 'auth',
        callouts: [{ type: 'info', text: 'resumeText is excluded from list results for performance. It is included in GET /candidates/:id.' }],
        queryParams: [
          { name: 'search', type: 'string', desc: 'Full-text on name, email, skills' },
          { name: 'source', type: 'enum', desc: 'manual · upload · referral · linkedin' },
          { name: 'tags', type: 'string', desc: 'Comma-separated tag list' },
          { name: 'page / limit / sortBy / order', type: '—', desc: 'Pagination and sorting' },
        ],
        responseCodes: ['200 OK — { candidates, total, page, pages }'],
      },
      { method: 'GET', path: '/candidates/:id', summary: 'Get candidate (full profile)', auth: 'auth', responseCodes: ['200 OK — { candidate }', '404 Not Found'] },
      { method: 'GET', path: '/candidates/:id/applications', summary: "Get candidate's applications", auth: 'auth', responseCodes: ['200 OK — { applications }'] },
      {
        method: 'POST', path: '/candidates', summary: 'Create candidate manually', auth: 'auth',
        callouts: [{ type: 'warn', text: 'If name+email fingerprint already exists, returns 409 with isDuplicate: true and the existing record.' }],
        bodyParams: [
          { name: 'name', type: 'string', required: true, desc: 'Full name' },
          { name: 'email', type: 'string', required: true, desc: 'Contact email' },
          { name: 'phone / location', type: 'string', required: false, desc: 'Optional contact info' },
          { name: 'linkedIn / github / portfolio', type: 'string', required: false, desc: 'Social links' },
          { name: 'source', type: 'enum', default: 'manual', desc: 'manual · upload · referral · linkedin' },
          { name: 'tags', type: 'string[]', required: false, desc: 'Custom labels' },
        ],
        responseCodes: ['201 Created', '400 Validation', '409 Duplicate'],
      },
      {
        method: 'POST', path: '/candidates/upload-resume', summary: '🤖 Upload resume + AI parse', auth: 'auth',
        callouts: [{ type: 'ai', text: 'Extracts text from PDF/DOC/DOCX, then calls POST /parse-resume on the AI service to populate parsedProfile with skills, experience, education, keywords, and total years of experience.' }],
        bodyParams: [{ name: 'resume', type: 'file (multipart)', required: true, desc: 'PDF, DOC, or DOCX — max 10 MB' }],
        responseExample: `{
  "candidate": {
    "resumeUrl": "/uploads/resume-abc.pdf",
    "parsedProfile": {
      "skills": ["React", "TypeScript", "Node.js"],
      "totalExperience": 5,
      "recommendation": "strong_yes"
    },
    "aiParsed": true
  }
}`,
        responseCodes: ['201 Created', '400 No file', '409 Duplicate'],
      },
      { method: 'PUT', path: '/candidates/:id', summary: 'Update candidate', auth: 'auth', responseCodes: ['200 OK — { candidate }'] },
      { method: 'DELETE', path: '/candidates/:id', summary: 'Delete candidate', auth: 'auth', description: 'Requires recruiter or admin role.', responseCodes: ['200 OK', '403 Forbidden', '404 Not Found'] },
    ],
  },
  {
    id: 'applications',
    icon: '📋',
    label: 'Applications',
    color: 'rgba(168,85,247,0.15)',
    description: 'Track candidates through the hiring pipeline. Each application has a stage, full history, and optional AI fit score (0–100).',
    endpoints: [
      {
        method: 'GET', path: '/applications', summary: 'List applications', auth: 'auth',
        queryParams: [
          { name: 'jobId', type: 'ObjectId', desc: 'Filter by job' },
          { name: 'stage', type: 'enum', desc: 'applied · screening · interview · offer · hired · rejected' },
          { name: 'isShortlisted', type: 'boolean', desc: 'Filter shortlisted only' },
          { name: 'minScore', type: 'number', desc: 'Minimum AI overall score (0–100)' },
          { name: 'sortBy', type: 'string', default: 'appliedAt', desc: 'Sort field' },
        ],
        responseCodes: ['200 OK — { applications, total, page, pages }'],
      },
      { method: 'GET', path: '/applications/:id', summary: 'Get application detail', auth: 'auth',
        description: 'Returns full application with populated job, candidate, stage history with user names, and AI score breakdown.',
        responseCodes: ['200 OK — { application }', '404 Not Found'] },
      {
        method: 'POST', path: '/applications', summary: 'Submit application', auth: 'auth',
        callouts: [{ type: 'warn', text: 'One candidate can only have one application per job. Duplicate returns 409.' }],
        bodyParams: [
          { name: 'job', type: 'ObjectId', required: true, desc: 'Job ID' },
          { name: 'candidate', type: 'ObjectId', required: true, desc: 'Candidate ID' },
          { name: 'coverLetter', type: 'string', required: false, desc: 'Cover letter text' },
        ],
        responseCodes: ['201 Created', '409 Already applied'],
      },
      {
        method: 'PATCH', path: '/applications/:id/stage', summary: 'Move pipeline stage', auth: 'auth',
        description: 'Appends to stageHistory, updates job pipeline counters, and fires email notifications.',
        bodyParams: [
          { name: 'stage', type: 'enum', required: true, desc: 'applied · screening · interview · offer · hired · rejected' },
          { name: 'note', type: 'string', required: false, desc: 'Note recorded in history' },
          { name: 'rejectionReason', type: 'string', required: false, desc: 'Required when stage = rejected' },
        ],
        responseCodes: ['200 OK — { application }', '404 Not Found'],
      },
      { method: 'PATCH', path: '/applications/:id/shortlist', summary: 'Toggle shortlist flag', auth: 'auth',
        description: 'Toggles isShortlisted. No request body needed. Creates in-app notification.',
        responseCodes: ['200 OK — { application }'] },
      {
        method: 'POST', path: '/applications/:id/score', summary: '🤖 Trigger AI scoring', auth: 'auth',
        callouts: [{ type: 'ai', text: 'Premium feature. Calls AI service /score-candidate with candidate parsedProfile and job data. Returns 0–100 score with skill/experience/education breakdown, matched/missing skills, and hire recommendation.' }],
        responseExample: `{
  "application": {
    "aiScore": {
      "overall": 82, "skillMatch": 88, "experienceMatch": 75,
      "explanation": "Strong React/TypeScript skills...",
      "matchedSkills": ["React", "TypeScript"],
      "missingSkills": ["AWS"],
      "recommendation": "strong_yes"
    }
  }
}`,
        responseCodes: ['200 OK', '503 AI unavailable'],
      },
      {
        method: 'GET', path: '/applications/rank/:jobId', summary: '🤖 Semantic candidate ranking', auth: 'auth',
        callouts: [
          { type: 'ai', text: 'Premium feature. Uses sentence-transformer embeddings (all-MiniLM-L6-v2) to compute cosine similarity between all candidate profiles and the job description. Returns candidates ranked by semantic fit.' },
          { type: 'warn', text: 'This route is declared before /:id in the router to avoid path collision.' },
        ],
        responseCodes: ['200 OK — { rankedApplications }', '503 AI unavailable'],
      },
      { method: 'PUT', path: '/applications/:id/review', summary: 'Add reviewer notes', auth: 'auth',
        bodyParams: [{ name: 'reviewNotes', type: 'string', required: false, desc: 'Internal review notes' }],
        responseCodes: ['200 OK — { application }'] },
    ],
  },
  {
    id: 'interviews',
    icon: '📅',
    label: 'Interviews',
    color: 'rgba(6,182,212,0.15)',
    description: 'Schedule, manage, and collect feedback. Scheduling auto-advances the application stage and emails the candidate.',
    endpoints: [
      {
        method: 'GET', path: '/interviews', summary: 'List interviews', auth: 'auth',
        queryParams: [
          { name: 'status', type: 'enum', desc: 'scheduled · completed · cancelled · rescheduled · no_show' },
          { name: 'upcoming', type: 'boolean', desc: 'If true, returns only future scheduled interviews' },
          { name: 'page / limit', type: 'number', desc: 'Pagination' },
        ],
        responseCodes: ['200 OK — { interviews, total, page, pages }'],
      },
      {
        method: 'POST', path: '/interviews', summary: 'Schedule interview', auth: 'auth',
        description: 'If the linked application is in applied or screening, it auto-advances to interview. Sends confirmation email to candidate.',
        bodyParams: [
          { name: 'application', type: 'ObjectId', required: true, desc: 'Application ID' },
          { name: 'job / candidate', type: 'ObjectId', required: true, desc: 'Job and candidate IDs' },
          { name: 'scheduledAt', type: 'date', required: true, desc: 'ISO date-time string' },
          { name: 'type', type: 'enum', default: 'phone_screen', desc: 'phone_screen · technical · hr · final · panel' },
          { name: 'mode', type: 'enum', default: 'video', desc: 'video · phone · in_person' },
          { name: 'duration', type: 'number', default: '60', desc: 'Minutes' },
          { name: 'interviewers', type: 'ObjectId[]', required: false, desc: 'User IDs' },
          { name: 'meetingLink', type: 'string', required: false, desc: 'Video call URL' },
          { name: 'round', type: 'number', default: '1', desc: 'Interview round number' },
        ],
        responseCodes: ['201 Created — { interview }', '400 Validation'],
      },
      { method: 'PATCH', path: '/interviews/:id/status', summary: 'Update status', auth: 'auth',
        bodyParams: [{ name: 'status', type: 'enum', required: true, desc: 'scheduled · completed · cancelled · rescheduled · no_show' }],
        responseCodes: ['200 OK — { interview }'] },
      {
        method: 'POST', path: '/interviews/:id/feedback', summary: 'Submit feedback', auth: 'auth',
        description: 'Saves feedback and automatically sets status to completed.',
        bodyParams: [
          { name: 'rating', type: 'number', required: true, desc: '1–5 star rating' },
          { name: 'recommendation', type: 'enum', required: true, desc: 'hire · no_hire · maybe · next_round' },
          { name: 'notes', type: 'string', required: false, desc: 'Detailed feedback' },
        ],
        responseCodes: ['200 OK — { interview }', '404 Not Found'],
      },
      { method: 'DELETE', path: '/interviews/:id', summary: 'Delete interview', auth: 'auth', responseCodes: ['200 OK', '404 Not Found'] },
    ],
  },
  {
    id: 'analytics',
    icon: '📊',
    label: 'Analytics',
    color: 'rgba(239,68,68,0.15)',
    description: 'Pre-aggregated recruitment metrics for the dashboard. All read-only, all require authentication.',
    endpoints: [
      {
        method: 'GET', path: '/analytics/overview', summary: 'KPI overview', auth: 'auth',
        responseExample: `{
  "kpis": {
    "totalJobs": 24, "openJobs": 12, "totalCandidates": 340,
    "totalApplications": 512, "shortlisted": 88, "hired": 18,
    "conversionRate": 3.5, "applicationGrowth": 12.4
  }
}`,
        responseCodes: ['200 OK'],
      },
      { method: 'GET', path: '/analytics/pipeline', summary: 'Pipeline stage distribution', auth: 'auth',
        queryParams: [{ name: 'jobId', type: 'ObjectId', desc: 'Filter to a single job pipeline' }],
        responseExample: `{ "pipeline": [{ "stage": "applied", "count": 120 }, ...] }`,
        responseCodes: ['200 OK'] },
      { method: 'GET', path: '/analytics/applications-over-time', summary: 'Application trend', auth: 'auth',
        queryParams: [{ name: 'days', type: 'number', default: '30', desc: 'How many days back to aggregate' }],
        responseExample: `{ "data": [{ "_id": "2025-05-01", "count": 14 }, ...] }`,
        responseCodes: ['200 OK'] },
      { method: 'GET', path: '/analytics/top-jobs', summary: 'Top 10 jobs by applications', auth: 'auth', responseCodes: ['200 OK — { jobs }'] },
      { method: 'GET', path: '/analytics/ai-scores', summary: 'AI score distribution', auth: 'auth', description: 'Histogram of AI scores grouped into 10-point buckets (0–10, 10–20 ... 90–100).', responseCodes: ['200 OK — { distribution }'] },
      { method: 'GET', path: '/analytics/source-breakdown', summary: 'Candidate source breakdown', auth: 'auth', responseCodes: ['200 OK — { breakdown }'] },
    ],
  },
  {
    id: 'notifications',
    icon: '🔔',
    label: 'Notifications',
    color: 'rgba(245,158,11,0.15)',
    description: 'In-app notification feed scoped to the authenticated user. Frontend polls every 30 seconds for the unread badge count.',
    endpoints: [
      {
        method: 'GET', path: '/notifications', summary: 'List notifications', auth: 'auth',
        queryParams: [
          { name: 'unreadOnly', type: 'boolean', default: 'false', desc: 'Return only unread' },
          { name: 'page / limit', type: 'number', default: '1 / 30', desc: 'Pagination' },
        ],
        responseExample: `{ "notifications": [...], "unreadCount": 4 }`,
        responseCodes: ['200 OK'],
      },
      { method: 'PATCH', path: '/notifications/:id/read', summary: 'Mark one as read', auth: 'auth', responseCodes: ['200 OK — { notification }', '404 Not Found'] },
      { method: 'PATCH', path: '/notifications/read-all', summary: 'Mark all as read', auth: 'auth', responseCodes: ['200 OK — { message }'] },
      { method: 'DELETE', path: '/notifications/:id', summary: 'Delete notification', auth: 'auth', responseCodes: ['200 OK — { message }'] },
    ],
  },
  {
    id: 'payments',
    icon: '💳',
    label: 'Payments',
    color: 'rgba(16,185,129,0.15)',
    description: 'Cashfree Payments integration for the ₹999/month Premium subscription. Implements order creation, client-side verification, and signed webhook.',
    endpoints: [
      {
        method: 'POST', path: '/payments/create-order', summary: 'Create Cashfree order', auth: 'auth',
        callouts: [{ type: 'info', text: 'Env vars required: CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV (sandbox|production), CLIENT_URL, API_URL' }],
        bodyParams: [{ name: 'phone', type: 'string', required: false, desc: 'Customer phone (defaults to 9999999999 if omitted)' }],
        responseExample: `{ "orderId": "premium_665a..._1715...", "paymentSessionId": "session_xyz...", "cfEnv": "sandbox" }`,
        responseCodes: ['200 OK', '503 Gateway not configured'],
      },
      {
        method: 'POST', path: '/payments/verify', summary: 'Verify payment & grant Premium', auth: 'auth',
        description: 'Called by the frontend after Cashfree redirects back. Verifies with Cashfree and sets isPremium: true on the user.',
        bodyParams: [{ name: 'orderId', type: 'string', required: true, desc: 'Order ID from create-order' }],
        responseExample: `{ "success": true, "isPremium": true, "orderStatus": "PAID" }`,
        responseCodes: ['200 OK', '400 Order ID missing', '503 Gateway error'],
      },
      {
        method: 'POST', path: '/payments/webhook', summary: 'Cashfree webhook (signed)', auth: 'webhook',
        callouts: [{ type: 'danger', text: 'Called by Cashfree servers — no JWT required. Verifies x-webhook-signature (HMAC-SHA256) before granting Premium.' }],
        responseCodes: ['200 OK', '400 Invalid signature'],
      },
      { method: 'GET', path: '/payments/status', summary: 'Check Premium status', auth: 'auth',
        responseExample: `{ "isPremium": true, "premiumSince": "2025-05-10T09:30:00Z" }`,
        responseCodes: ['200 OK'] },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const METHOD_STYLES: Record<Method, string> = {
  GET:    'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  POST:   'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  PUT:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  PATCH:  'bg-purple-500/10 text-purple-400 border border-purple-500/20',
  DELETE: 'bg-red-500/10 text-red-400 border border-red-500/20',
};

const AUTH_STYLES: Record<AuthLevel, string> = {
  public:   'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  auth:     'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20',
  admin:    'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  webhook:  'bg-red-500/10 text-red-400 border border-red-500/20',
  internal: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
};

const AUTH_LABELS: Record<AuthLevel, string> = {
  public: 'Public', auth: 'Auth', admin: 'Admin', webhook: 'Webhook', internal: 'Internal',
};

const CALLOUT_STYLES = {
  info:   'bg-blue-500/8 border-l-2 border-blue-400 text-blue-300',
  warn:   'bg-amber-500/8 border-l-2 border-amber-400 text-amber-300',
  danger: 'bg-red-500/8 border-l-2 border-red-400 text-red-300',
  ai:     'bg-purple-500/8 border-l-2 border-purple-400 text-purple-300',
};

const RC_COLOR = (rc: string) =>
  rc.startsWith('2') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
  rc.startsWith('4') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                       'bg-red-500/10 text-red-400 border border-red-500/20';

// ─── Sub-components ───────────────────────────────────────────────────────────

function ParamTable({ params, title }: { params: Param[]; title: string }) {
  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-mono mb-2">{title}</p>
      <div className="rounded-lg border border-white/[0.07] overflow-hidden text-xs">
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.03] border-b border-white/[0.07]">
              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono">Name</th>
              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono">Type</th>
              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono">Req</th>
              <th className="text-left px-3 py-2 text-[10px] uppercase tracking-widest text-slate-500 font-mono">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr key={i} className="border-b border-white/[0.04] last:border-0">
                <td className="px-3 py-2.5 font-mono text-sky-300">{p.name}</td>
                <td className="px-3 py-2.5 font-mono text-cyan-500 text-[11px]">{p.type}</td>
                <td className="px-3 py-2.5 font-mono text-[10px]">
                  {p.required ? <span className="text-red-400">required</span>
                    : p.default ? <span className="text-slate-500">{p.default}</span>
                    : <span className="text-slate-600">—</span>}
                </td>
                <td className="px-3 py-2.5 text-slate-400">{p.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="mt-4">
      <p className="text-[11px] uppercase tracking-widest text-slate-500 font-mono mb-1.5">{label}</p>
      <pre className="bg-[#0d1117] border border-white/[0.07] rounded-lg px-4 py-3 text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

function EndpointRow({ ep }: { ep: Endpoint }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border transition-colors ${open ? 'border-white/[0.12] bg-white/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <span className={`font-mono text-[11px] font-semibold px-2 py-1 rounded-md w-14 text-center shrink-0 ${METHOD_STYLES[ep.method]}`}>
          {ep.method}
        </span>
        <span className="font-mono text-sm text-slate-200 flex-1 min-w-0 truncate">{ep.path}</span>
        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0 hidden sm:block ${AUTH_STYLES[ep.auth]}`}>
          {AUTH_LABELS[ep.auth]}
        </span>
        <span className="text-slate-500 text-xs hidden md:block shrink-0">{ep.summary}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-500 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-white/[0.07] pt-4">
          {ep.description && <p className="text-slate-400 text-sm mb-3 leading-relaxed">{ep.description}</p>}

          {ep.callouts?.map((c, i) => (
            <div key={i} className={`rounded-lg px-3.5 py-2.5 text-xs leading-relaxed mb-3 ${CALLOUT_STYLES[c.type]}`}>
              {c.text}
            </div>
          ))}

          {ep.queryParams && <ParamTable params={ep.queryParams} title="Query Parameters" />}
          {ep.bodyParams && <ParamTable params={ep.bodyParams} title="Request Body" />}
          {ep.requestExample && <CodeBlock label="Example Request" code={ep.requestExample} />}
          {ep.responseExample && <CodeBlock label="Example Response" code={ep.responseExample} />}

          {ep.responseCodes && (
            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-widest text-slate-500 font-mono mb-2">Response Codes</p>
              <div className="flex flex-wrap gap-2">
                {ep.responseCodes.map((rc, i) => (
                  <span key={i} className={`font-mono text-[11px] px-2.5 py-1 rounded-md ${RC_COLOR(rc.split(' ')[0])}`}>{rc}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [query, setQuery] = useState('');
  const [activeSection, setActiveSection] = useState('auth');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Filter endpoints by search query
  const filtered = query.trim()
    ? SECTIONS.map(s => ({
        ...s,
        endpoints: s.endpoints.filter(e =>
          e.path.toLowerCase().includes(query.toLowerCase()) ||
          e.summary.toLowerCase().includes(query.toLowerCase()) ||
          e.method.toLowerCase().includes(query.toLowerCase())
        ),
      })).filter(s => s.endpoints.length > 0)
    : SECTIONS;

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    Object.values(sectionRefs.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0f1a] text-slate-200 flex" style={{ fontFamily: "'DM Mono', monospace" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 99px; }
        .font-sans { font-family: 'DM Sans', sans-serif; }
        .font-mono { font-family: 'DM Mono', monospace; }
      `}</style>

      {/* ── Sidebar nav ── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 bg-[#111827] border-r border-white/[0.06] h-screen sticky top-0 overflow-y-auto">
        {/* Back link */}
        <div className="p-4 border-b border-white/[0.06]">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs transition-colors font-sans">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to app
          </Link>
          <div className="mt-3">
            <p className="text-sm font-bold text-slate-100 font-sans">TalentFlow AI</p>
            <p className="text-[11px] text-indigo-400 font-mono mt-0.5">API Reference v1</p>
          </div>
        </div>

        {/* Base URL */}
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] uppercase tracking-widest text-slate-600 mb-1 font-mono">Base URL</p>
          <p className="text-[11px] text-slate-400 font-mono break-all">{BASE_URL}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          <p className="px-4 text-[10px] uppercase tracking-widest text-slate-600 mb-2 font-mono">Endpoints</p>
          {SECTIONS.map(s => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className={`flex items-center gap-2.5 px-4 py-2 text-xs transition-all font-sans border-l-2 ${
                activeSection === s.id
                  ? 'text-indigo-300 border-indigo-500 bg-indigo-500/5'
                  : 'text-slate-500 border-transparent hover:text-slate-300 hover:bg-white/[0.03]'
              }`}
            >
              <span className="text-base leading-none">{s.icon}</span>
              {s.label}
            </a>
          ))}
        </nav>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#0b0f1a]/90 backdrop-blur border-b border-white/[0.06] px-4 md:px-8 py-3 flex items-center gap-4">
          <Link href="/" className="lg:hidden flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs shrink-0 transition-colors font-sans">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search endpoints..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 font-mono"
            />
          </div>
          <div className="hidden sm:flex items-center gap-2 ml-auto">
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">v1.0</span>
            <span className="text-[11px] font-mono px-2 py-1 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">REST · JSON</span>
          </div>
        </div>

        <div className="px-4 md:px-8 py-8 max-w-4xl">
          {/* Page header */}
          <div className="mb-10">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-[11px] text-indigo-400 font-mono mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
              Smart ATS Hiring Suite · API v1
            </div>
            <h1 className="text-3xl font-bold text-slate-100 mb-3 font-sans tracking-tight">API Reference</h1>
            <p className="text-slate-400 max-w-xl leading-relaxed text-sm font-sans">
              Complete REST API for TalentFlow AI. Protected routes require a
              <code className="mx-1 px-1.5 py-0.5 bg-white/[0.06] rounded text-indigo-300 text-xs">Bearer</code>
              token from the auth endpoints.
            </p>

            {/* Info chips */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                ['Base URL', BASE_URL],
                ['Auth', 'JWT Bearer · 7d expiry'],
                ['Rate Limit', '200 req / 15 min'],
                ['Format', 'JSON · HTTPS'],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#111827] border border-white/[0.08] rounded-lg px-3 py-2">
                  <p className="text-[10px] uppercase tracking-widest text-slate-600 font-mono">{label}</p>
                  <p className="text-xs text-slate-300 font-mono mt-0.5">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Auth explanation */}
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 mb-10 text-sm text-slate-400 font-sans leading-relaxed">
            <strong className="text-slate-200">Authentication:</strong> Include the token in every protected request:
            <pre className="mt-2 bg-[#0d1117] rounded-lg px-4 py-2.5 text-xs font-mono text-slate-300">
              Authorization: Bearer &lt;your_jwt_token&gt;
            </pre>
            <p className="mt-2 text-xs">
              Roles: <code className="text-amber-400">admin</code> · <code className="text-indigo-300">recruiter</code> · <code className="text-indigo-300">hiring_manager</code>.
              First registered user becomes admin automatically.
            </p>
          </div>

          {/* Sections */}
          {filtered.map(section => (
            <section
              key={section.id}
              id={section.id}
              ref={el => { sectionRefs.current[section.id] = el; }}
              className="mb-12"
            >
              <div className="flex items-center gap-3 mb-2 pb-3 border-b border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ background: section.color }}>
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-100 font-sans">{section.label}</h2>
                </div>
                <span className="font-mono text-xs text-slate-600 ml-1">/api/{section.id === 'auth' ? 'auth' : section.id}</span>
              </div>
              <p className="text-slate-500 text-sm mb-4 font-sans leading-relaxed">{section.description}</p>

              <div className="space-y-2">
                {section.endpoints.map((ep, i) => (
                  <EndpointRow key={i} ep={ep} />
                ))}
              </div>
            </section>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-20 text-slate-600 font-sans">
              No endpoints match <span className="text-slate-400">"{query}"</span>
            </div>
          )}

          <footer className="mt-16 pt-6 border-t border-white/[0.06] text-center text-[11px] text-slate-700 font-mono">
            Smart ATS Hiring Suite · TalentFlow AI · API v1.0
          </footer>
        </div>
      </main>
    </div>
  );
}