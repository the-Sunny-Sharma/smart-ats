/**
 * seed.js — Smart ATS Demo Data Seeder
 * ─────────────────────────────────────
 * Creates demo accounts, jobs, candidates, applications (with AI scores),
 * and one scheduled interview so the evaluator can see every feature live.
 *
 * Usage:
 *   cd backend/api-gateway
 *   node seed.js
 *
 * Safe to re-run — skips anything that already exists (upsert by email / title).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');
const crypto   = require('crypto');

// ─── Models ──────────────────────────────────────────────────────────────────
const User        = require('./src/models/User.model');
const Job         = require('./src/models/Job.model');
const Candidate   = require('./src/models/Candidate.model');
const Application = require('./src/models/Application.model');
const Interview   = require('./src/models/Interview.model');
const Notification = require('./src/models/Notification.model');

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fp = (name, email) =>
  crypto.createHash('md5').update(`${name.toLowerCase()}${email.toLowerCase()}`).digest('hex');

const log = {
  info:    (m) => console.log(`  ✔  ${m}`),
  skip:    (m) => console.log(`  –  ${m} (already exists, skipped)`),
  section: (m) => console.log(`\n▶ ${m}`),
  done:    (m) => console.log(`\n✅ ${m}`),
  err:     (m) => console.error(`  ✖  ${m}`),
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const USERS = [
  {
    name:     'Alex Admin',
    email:    'admin@talentflow.ai',
    password: 'Admin@123',
    role:     'admin',
  },
  {
    name:     'Rachel Recruiter',
    email:    'recruiter@talentflow.ai',
    password: 'Recruiter@123',
    role:     'recruiter',
  },
  {
    name:     'Henry Hiring',
    email:    'hiring@talentflow.ai',
    password: 'Manager@123',
    role:     'hiring_manager',
  },
];

const JOBS_DATA = [
  {
    title:         'Senior Full Stack Developer',
    department:    'Engineering',
    location:      'Bangalore, India',
    locationType:  'hybrid',
    type:          'full-time',
    description:   'We are looking for a Senior Full Stack Developer to join our growing engineering team. You will design, build, and maintain scalable web applications across the entire stack.',
    requirements:  [
      '4+ years of full-stack development experience',
      'Proficiency in React and Node.js',
      'Experience with MongoDB or PostgreSQL',
      'Strong understanding of REST APIs and microservices',
    ],
    responsibilities: [
      'Build and maintain frontend features using React and Next.js',
      'Design and develop RESTful APIs using Node.js and Express',
      'Collaborate with product and design teams',
      'Code reviews and mentoring junior developers',
    ],
    skills:        ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker', 'AWS'],
    experienceMin: 4,
    experienceMax: 8,
    salaryMin:     1200000,
    salaryMax:     2000000,
    currency:      'INR',
    status:        'open',
  },
  {
    title:         'Product Designer (UI/UX)',
    department:    'Design',
    location:      'Mumbai, India',
    locationType:  'remote',
    type:          'full-time',
    description:   'Join our design team to craft beautiful and intuitive experiences for our SaaS platform. You will own the end-to-end design process from research to production.',
    requirements:  [
      '3+ years of product design experience',
      'Strong portfolio of shipped products',
      'Proficiency in Figma',
      'Experience with design systems',
    ],
    responsibilities: [
      'Conduct user research and usability testing',
      'Create wireframes, prototypes, and high-fidelity mockups',
      'Maintain and evolve the design system',
      'Work closely with engineering to ensure accurate implementation',
    ],
    skills:        ['Figma', 'User Research', 'Design Systems', 'Prototyping', 'Tailwind CSS'],
    experienceMin: 3,
    experienceMax: 6,
    salaryMin:     800000,
    salaryMax:     1500000,
    currency:      'INR',
    status:        'open',
  },
  {
    title:         'ML Engineer — NLP',
    department:    'AI / ML',
    location:      'Hyderabad, India',
    locationType:  'onsite',
    type:          'full-time',
    description:   'We are building cutting-edge NLP models for our AI-powered recruitment platform. Looking for an ML Engineer with hands-on NLP experience to join our AI team.',
    requirements:  [
      '3+ years of ML/NLP experience',
      'Hands-on with LLMs and transformers',
      'Experience with Python, PyTorch or TensorFlow',
      'Familiarity with LLM APIs (OpenAI, Groq, Hugging Face)',
    ],
    responsibilities: [
      'Fine-tune and evaluate LLMs for domain-specific tasks',
      'Build data pipelines for training and evaluation',
      'Integrate AI models into production APIs',
      'Research and implement state-of-the-art NLP techniques',
    ],
    skills:        ['Python', 'PyTorch', 'NLP', 'LLMs', 'FastAPI', 'Hugging Face'],
    experienceMin: 3,
    experienceMax: 7,
    salaryMin:     1500000,
    salaryMax:     2500000,
    currency:      'INR',
    status:        'open',
  },
];

const CANDIDATES_DATA = [
  {
    name:     'Priya Sharma',
    email:    'priya.sharma@gmail.com',
    phone:    '+91-9876543210',
    location: 'Bangalore, India',
    linkedIn: 'https://linkedin.com/in/priyasharma',
    github:   'https://github.com/priyasharma',
    source:   'upload',
    tags:     ['react', 'nodejs', 'senior'],
    parsedProfile: {
      summary:         'Senior Full Stack Developer with 6 years of experience building scalable SaaS products using React, Node.js, and MongoDB. Led teams of 5+ engineers.',
      skills:          ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'GraphQL'],
      totalExperience: 6,
      experience: [
        { company: 'Flipkart', title: 'Senior SDE', duration: '2021 - Present', description: 'Led development of seller portal, handling 10M+ monthly users.' },
        { company: 'Razorpay', title: 'SDE II', duration: '2019 - 2021', description: 'Built payment APIs and dashboard features.' },
      ],
      education: [
        { institution: 'IIT Bombay', degree: 'B.Tech', field: 'Computer Science', year: '2018' },
      ],
      keywords: ['React', 'Node.js', 'AWS', 'microservices', 'REST APIs', 'team lead'],
    },
  },
  {
    name:     'Arjun Mehta',
    email:    'arjun.mehta@outlook.com',
    phone:    '+91-9812345678',
    location: 'Pune, India',
    github:   'https://github.com/arjunmehta',
    source:   'referral',
    tags:     ['nodejs', 'backend', 'mid-level'],
    parsedProfile: {
      summary:         'Backend developer with 4 years of experience in Node.js and Express. Comfortable with both SQL and NoSQL databases.',
      skills:          ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
      totalExperience: 4,
      experience: [
        { company: 'Zomato', title: 'Backend Engineer', duration: '2022 - Present', description: 'Designed and built order management microservices.' },
        { company: 'Infosys', title: 'Software Engineer', duration: '2020 - 2022', description: 'Maintained enterprise Java and Node.js applications.' },
      ],
      education: [
        { institution: 'Pune University', degree: 'B.E.', field: 'Information Technology', year: '2020' },
      ],
      keywords: ['Node.js', 'microservices', 'PostgreSQL', 'REST', 'Docker'],
    },
  },
  {
    name:     'Sneha Nair',
    email:    'sneha.nair@gmail.com',
    phone:    '+91-9823456789',
    location: 'Kerala, India',
    linkedIn: 'https://linkedin.com/in/snehanair',
    source:   'linkedin',
    tags:     ['design', 'figma', 'ux'],
    parsedProfile: {
      summary:         'Product Designer with 5 years crafting user-centered digital experiences. Specialised in SaaS and fintech design.',
      skills:          ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Adobe XD'],
      totalExperience: 5,
      experience: [
        { company: 'CRED', title: 'Senior Product Designer', duration: '2021 - Present', description: 'Owned design for core payments and rewards flows.' },
        { company: 'Swiggy', title: 'UI/UX Designer', duration: '2019 - 2021', description: 'Redesigned the restaurant partner app, improving retention by 30%.' },
      ],
      education: [
        { institution: 'NID Ahmedabad', degree: 'M.Des', field: 'Interaction Design', year: '2019' },
      ],
      keywords: ['Figma', 'UX', 'design systems', 'SaaS', 'user research'],
    },
  },
  {
    name:     'Rohan Verma',
    email:    'rohan.verma@proton.me',
    phone:    '+91-9898989898',
    location: 'Hyderabad, India',
    github:   'https://github.com/rohanverma',
    source:   'upload',
    tags:     ['python', 'ml', 'nlp'],
    parsedProfile: {
      summary:         'ML Engineer with 4 years specialising in NLP and large language models. Contributed to open-source LLM tooling.',
      skills:          ['Python', 'PyTorch', 'NLP', 'Transformers', 'FastAPI', 'LLMs', 'Hugging Face'],
      totalExperience: 4,
      experience: [
        { company: 'Sarvam AI', title: 'ML Engineer', duration: '2022 - Present', description: 'Built and fine-tuned multilingual LLMs for Indian languages.' },
        { company: 'TCS Research', title: 'Research Engineer', duration: '2020 - 2022', description: 'NLP research in document classification and extraction.' },
      ],
      education: [
        { institution: 'IIT Hyderabad', degree: 'M.Tech', field: 'AI & ML', year: '2020' },
      ],
      keywords: ['LLMs', 'NLP', 'PyTorch', 'Python', 'fine-tuning', 'RAG'],
    },
  },
  {
    name:     'Kavya Reddy',
    email:    'kavya.reddy@gmail.com',
    phone:    '+91-9701234567',
    location: 'Chennai, India',
    linkedIn: 'https://linkedin.com/in/kavyareddy',
    source:   'manual',
    tags:     ['react', 'frontend', 'junior'],
    parsedProfile: {
      summary:         'Frontend developer with 2 years of experience building responsive web apps with React and Tailwind CSS.',
      skills:          ['React', 'JavaScript', 'Tailwind CSS', 'HTML', 'CSS', 'Git'],
      totalExperience: 2,
      experience: [
        { company: 'Freshworks', title: 'Frontend Developer', duration: '2023 - Present', description: 'Building internal tooling dashboards with React.' },
      ],
      education: [
        { institution: 'Anna University', degree: 'B.E.', field: 'Computer Science', year: '2023' },
      ],
      keywords: ['React', 'JavaScript', 'CSS', 'responsive design'],
    },
  },
];

// ─── Main Seeder ──────────────────────────────────────────────────────────────
async function seed() {
  const MONGO_URI =
    process.env.MONGODB_URI ||
    'mongodb://admin:secret@localhost:27017/smartats?authSource=admin';

  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   Smart ATS — Demo Data Seeder       ║');
  console.log('╚══════════════════════════════════════╝\n');

  try {
    await mongoose.connect(MONGO_URI);
    console.log('  Connected to MongoDB:', MONGO_URI.replace(/:\/\/.*@/, '://***@'));
  } catch (err) {
    log.err(`MongoDB connection failed: ${err.message}`);
    log.err('Make sure MongoDB is running (docker-compose up mongodb)');
    process.exit(1);
  }

  // ── 1. Users ───────────────────────────────────────────────────────────────
  log.section('Creating users');
  const userMap = {};

  for (const u of USERS) {
    const existing = await User.findOne({ email: u.email });
    if (existing) {
      log.skip(`${u.role} — ${u.email}`);
      userMap[u.role] = existing;
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, 12);
    const user = await User.create({
      name:     u.name,
      email:    u.email,
      password: passwordHash,
      role:     u.role,
      isActive: true,
    });
    userMap[u.role] = user;
    log.info(`${u.role} — ${u.email} / ${u.password}`);
  }

  // ── 2. Jobs ────────────────────────────────────────────────────────────────
  log.section('Creating jobs');
  const jobs = [];

  for (const j of JOBS_DATA) {
    const existing = await Job.findOne({ title: j.title });
    if (existing) {
      log.skip(j.title);
      jobs.push(existing);
      continue;
    }
    const job = await Job.create({
      ...j,
      postedBy:       userMap['recruiter']._id,
      hiringManager:  userMap['hiring_manager']._id,
    });
    jobs.push(job);
    log.info(j.title);
  }

  // ── 3. Candidates ──────────────────────────────────────────────────────────
  log.section('Creating candidates');
  const candidates = [];

  for (const c of CANDIDATES_DATA) {
    const fingerprint = fp(c.name, c.email);
    const existing = await Candidate.findOne({ fingerprint });
    if (existing) {
      log.skip(c.name);
      candidates.push(existing);
      continue;
    }
    const candidate = await Candidate.create({
      ...c,
      fingerprint,
      addedBy: userMap['recruiter']._id,
    });
    candidates.push(candidate);
    log.info(c.name);
  }

  // ── 4. Applications with realistic AI scores ───────────────────────────────
  log.section('Creating applications');

  const applicationsData = [
    // Job 0: Senior Full Stack Developer
    {
      jobIdx:       0,
      candidateIdx: 0,  // Priya Sharma — great fit
      stage:        'interview',
      isShortlisted: true,
      aiScore: {
        overall: 91, skillMatch: 95, experienceMatch: 88, educationMatch: 90,
        explanation: 'Priya is an excellent fit. She has 6 years of direct experience with React, Node.js, TypeScript, and MongoDB — all core requirements. Her leadership experience at Flipkart and Razorpay closely mirrors the role responsibilities.',
        matchedSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker'],
        missingSkills: [],
        recommendation: 'strong_yes',
        scoredAt: new Date(),
      },
    },
    {
      jobIdx:       0,
      candidateIdx: 1,  // Arjun Mehta — decent fit
      stage:        'screening',
      isShortlisted: true,
      aiScore: {
        overall: 74, skillMatch: 70, experienceMatch: 80, educationMatch: 72,
        explanation: 'Arjun has solid backend Node.js experience and meets the seniority requirement. However, his React skills are limited and he lacks TypeScript and AWS experience listed as required.',
        matchedSkills: ['Node.js', 'Docker', 'PostgreSQL'],
        missingSkills: ['React', 'TypeScript', 'AWS'],
        recommendation: 'yes',
        scoredAt: new Date(),
      },
    },
    {
      jobIdx:       0,
      candidateIdx: 4,  // Kavya Reddy — weak fit (junior)
      stage:        'applied',
      isShortlisted: false,
      aiScore: {
        overall: 42, skillMatch: 50, experienceMatch: 28, educationMatch: 55,
        explanation: 'Kavya has frontend React skills but only 2 years of experience against the 4+ requirement. She lacks backend Node.js and cloud experience essential for a senior full-stack role.',
        matchedSkills: ['React', 'JavaScript'],
        missingSkills: ['Node.js', 'TypeScript', 'AWS', 'Docker', 'MongoDB'],
        recommendation: 'no',
        scoredAt: new Date(),
      },
    },
    // Job 1: Product Designer
    {
      jobIdx:       1,
      candidateIdx: 2,  // Sneha Nair — excellent fit
      stage:        'offer',
      isShortlisted: true,
      aiScore: {
        overall: 95, skillMatch: 98, experienceMatch: 90, educationMatch: 95,
        explanation: 'Sneha is a near-perfect match. Her 5 years in product design at CRED and Swiggy, combined with a masters from NID, precisely match the role. She has shipped design systems and owns a strong portfolio.',
        matchedSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Adobe XD'],
        missingSkills: [],
        recommendation: 'strong_yes',
        scoredAt: new Date(),
      },
    },
    // Job 2: ML Engineer NLP
    {
      jobIdx:       2,
      candidateIdx: 3,  // Rohan Verma — strong fit
      stage:        'screening',
      isShortlisted: true,
      aiScore: {
        overall: 88, skillMatch: 92, experienceMatch: 82, educationMatch: 88,
        explanation: 'Rohan has exactly the NLP and LLM background required. His work at Sarvam AI on multilingual LLMs and M.Tech from IIT Hyderabad make him a strong candidate for this role.',
        matchedSkills: ['Python', 'PyTorch', 'NLP', 'LLMs', 'FastAPI', 'Hugging Face', 'Transformers'],
        missingSkills: ['TensorFlow'],
        recommendation: 'strong_yes',
        scoredAt: new Date(),
      },
    },
  ];

  const applicationDocs = [];

  for (const a of applicationsData) {
    const job       = jobs[a.jobIdx];
    const candidate = candidates[a.candidateIdx];
    if (!job || !candidate) continue;

    const existing = await Application.findOne({ job: job._id, candidate: candidate._id });
    if (existing) {
      log.skip(`${candidate.name} → ${job.title}`);
      applicationDocs.push(existing);
      continue;
    }

    const app = await Application.create({
      job:          job._id,
      candidate:    candidate._id,
      stage:        a.stage,
      isShortlisted: a.isShortlisted,
      aiScore:      a.aiScore,
      submittedBy:  userMap['recruiter']._id,
      stageHistory: [{ stage: a.stage, changedBy: userMap['recruiter']._id, note: 'Seeded' }],
    });

    // Update job pipeline counts
    await Job.findByIdAndUpdate(job._id, {
      $inc: {
        totalApplications:     1,
        [`pipeline.${a.stage}`]: 1,
      },
    });

    applicationDocs.push(app);
    log.info(`${candidate.name} → ${job.title} [${a.stage}, score: ${a.aiScore.overall}]`);
  }

  // ── 5. Interview ───────────────────────────────────────────────────────────
  log.section('Creating interview');

  const interviewApp = applicationDocs.find(
    (a) => a.stage === 'interview',
  );

  if (interviewApp) {
    const existingInterview = await Interview.findOne({ application: interviewApp._id });
    if (existingInterview) {
      log.skip('Interview for Priya Sharma (already exists)');
    } else {
      const scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 3); // 3 days from now
      scheduledAt.setHours(11, 0, 0, 0);

      await Interview.create({
        application:  interviewApp._id,
        job:          interviewApp.job,
        candidate:    interviewApp.candidate,
        type:         'technical',
        round:        2,
        scheduledAt,
        duration:     60,
        timezone:     'Asia/Kolkata',
        mode:         'video',
        meetingLink:  'https://meet.google.com/demo-link-xyz',
        interviewers: [userMap['hiring_manager']._id],
        scheduledBy:  userMap['recruiter']._id,
        status:       'scheduled',
      });
      log.info('Technical interview for Priya Sharma (in 3 days, video)');
    }
  }

  // ── 6. Welcome notifications ───────────────────────────────────────────────
  log.section('Creating welcome notifications');

  for (const role of ['admin', 'recruiter', 'hiring_manager']) {
    const user = userMap[role];
    if (!user) continue;

    const exists = await Notification.findOne({ user: user._id, type: 'job_posted' });
    if (exists) { log.skip(`Notification for ${role}`); continue; }

    await Notification.create({
      user:    user._id,
      type:    'job_posted',
      title:   '👋 Welcome to TalentFlow AI',
      message: 'Your demo workspace is ready. 3 jobs and 5 candidates have been loaded. Explore the AI scoring and shortlisting features!',
      link:    '/dashboard',
    });
    log.info(`Welcome notification for ${role}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  log.done('Seeding complete!\n');
  console.log('─────────────────────────────────────────');
  console.log('  Login credentials:');
  console.log('');
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(15)}  ${u.email}  /  ${u.password}`);
  }
  console.log('');
  console.log('  Frontend:  http://localhost:3000');
  console.log('  API:       http://localhost:5000');
  console.log('  AI:        http://localhost:8000');
  console.log('─────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n✖ Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});