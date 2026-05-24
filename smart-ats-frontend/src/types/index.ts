// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'hiring_manager';
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

// ─── Job ─────────────────────────────────────────────────────────────────────
export interface Job {
  _id: string;
  title: string;
  department: string;
  location: string;
  locationType: 'remote' | 'onsite' | 'hybrid';
  type: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  experienceMin: number;
  experienceMax: number;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  status: 'draft' | 'open' | 'paused' | 'closed';
  postedBy: User;
  hiringManager?: User;
  deadline?: string;
  totalApplications: number;
  pipeline: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

// ─── Candidate ───────────────────────────────────────────────────────────────
export interface Candidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  linkedIn?: string;
  github?: string;
  portfolio?: string;
  resumeUrl?: string;
  parsedProfile?: {
    summary?: string;
    skills: string[];
    experience: {
      company: string;
      title: string;
      duration: string;
      description: string;
    }[];
    education: {
      institution: string;
      degree: string;
      field: string;
      year: string;
    }[];
    totalExperience: number;
    keywords: string[];
  };
  source: 'manual' | 'upload' | 'referral' | 'linkedin';
  tags: string[];
  notes?: string;
  addedBy?: User;
  createdAt: string;
}

// ─── Application ─────────────────────────────────────────────────────────────
export type ApplicationStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';

export interface Application {
  _id: string;
  job: Job;
  candidate: Candidate;
  stage: ApplicationStage;
  stageHistory: {
    stage: string;
    changedBy: User;
    changedAt: string;
    note?: string;
  }[];
  aiScore?: {
    overall: number;
    skillMatch: number;
    experienceMatch: number;
    educationMatch: number;
    explanation: string;
    matchedSkills: string[];
    missingSkills: string[];
    recommendation: 'strong_yes' | 'yes' | 'maybe' | 'no';
    scoredAt: string;
  };
  isShortlisted: boolean;
  isDuplicate: boolean;
  reviewedBy?: User;
  reviewNotes?: string;
  rejectionReason?: string;
  coverLetter?: string;
  appliedAt: string;
  submittedBy?: User;
}

// ─── Interview ────────────────────────────────────────────────────────────────
export interface Interview {
  _id: string;
  application: Application | string;
  job: Job;
  candidate: Candidate;
  type: 'phone_screen' | 'technical' | 'hr' | 'final' | 'panel';
  round: number;
  scheduledAt: string;
  duration: number;
  timezone: string;
  mode: 'video' | 'phone' | 'in_person';
  meetingLink?: string;
  location?: string;
  interviewers: User[];
  scheduledBy: User;
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled' | 'no_show';
  feedback?: {
    rating: number;
    notes: string;
    recommendation: 'hire' | 'no_hire' | 'maybe' | 'next_round';
    submittedBy: User;
    submittedAt: string;
  };
  createdAt: string;
}

// ─── Notification ─────────────────────────────────────────────────────────────
export interface Notification {
  _id: string;
  user: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface AnalyticsOverview {
  kpis: {
    totalJobs: number;
    openJobs: number;
    totalCandidates: number;
    totalApplications: number;
    shortlisted: number;
    hired: number;
    interviews: number;
    conversionRate: number;
    applicationGrowth: number;
  };
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  total: number;
  page: number;
  pages: number;
  data: T[];
}
