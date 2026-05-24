/**
 * seed.js — Smart ATS Demo Data Seeder (Enhanced)
 * ─────────────────────────────────────────────────
 * Creates rich demo data:
 *   - 3 users (admin, recruiter, hiring manager)
 *   - 8 jobs across departments
 *   - 15 candidates with full parsed profiles
 *   - 20+ applications spread across ALL pipeline stages
 *   - 5 interviews (scheduled, completed, cancelled)
 *   - Notifications for each user
 *
 * Usage:
 *   cd backend/api-gateway
 *   node seed.js
 *
 * Safe to re-run — skips anything that already exists.
 */

require('dotenv').config();
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const crypto    = require('crypto');

const User         = require('./src/models/User.model');
const Job          = require('./src/models/Job.model');
const Candidate    = require('./src/models/Candidate.model');
const Application  = require('./src/models/Application.model');
const Interview    = require('./src/models/Interview.model');
const Notification = require('./src/models/Notification.model');

const fp = (name, email) =>
  crypto.createHash('md5').update(`${name.toLowerCase()}${email.toLowerCase()}`).digest('hex');

const log = {
  info:    (m) => console.log(`  ✔  ${m}`),
  skip:    (m) => console.log(`  –  ${m} (skipped)`),
  section: (m) => console.log(`\n▶ ${m}`),
  done:    (m) => console.log(`\n✅ ${m}`),
  err:     (m) => console.error(`  ✖  ${m}`),
};

// ─── USERS ────────────────────────────────────────────────────────────────────

const USERS = [
  { name: 'Alex Admin',      email: 'admin@talentflow.ai',     password: 'Admin@123',     role: 'admin' },
  { name: 'Rachel Recruiter',email: 'recruiter@talentflow.ai', password: 'Recruiter@123', role: 'recruiter' },
  { name: 'Henry Hiring',    email: 'hiring@talentflow.ai',    password: 'Manager@123',   role: 'hiring_manager' },
];

// ─── JOBS ─────────────────────────────────────────────────────────────────────

const JOBS_DATA = [
  {
    title: 'Senior Full Stack Developer',
    department: 'Engineering',
    location: 'Bangalore, India',
    locationType: 'hybrid',
    type: 'full-time',
    description: 'We are looking for a Senior Full Stack Developer to join our growing engineering team. You will design, build, and maintain scalable web applications across the entire stack.',
    requirements: ['4+ years of full-stack development experience', 'Proficiency in React and Node.js', 'Experience with MongoDB or PostgreSQL', 'Strong understanding of REST APIs and microservices'],
    responsibilities: ['Build and maintain frontend features using React and Next.js', 'Design and develop RESTful APIs using Node.js and Express', 'Collaborate with product and design teams', 'Code reviews and mentoring junior developers'],
    skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Docker', 'AWS'],
    experienceMin: 4, experienceMax: 8,
    salaryMin: 1200000, salaryMax: 2000000, currency: 'INR', status: 'open',
  },
  {
    title: 'Product Designer (UI/UX)',
    department: 'Design',
    location: 'Mumbai, India',
    locationType: 'remote',
    type: 'full-time',
    description: 'Join our design team to craft beautiful and intuitive experiences for our SaaS platform. You will own the end-to-end design process from research to production.',
    requirements: ['3+ years of product design experience', 'Strong portfolio of shipped products', 'Proficiency in Figma', 'Experience with design systems'],
    responsibilities: ['Conduct user research and usability testing', 'Create wireframes, prototypes, and high-fidelity mockups', 'Maintain and evolve the design system', 'Work closely with engineering to ensure accurate implementation'],
    skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping', 'Tailwind CSS'],
    experienceMin: 3, experienceMax: 6,
    salaryMin: 800000, salaryMax: 1500000, currency: 'INR', status: 'open',
  },
  {
    title: 'ML Engineer — NLP',
    department: 'AI / ML',
    location: 'Hyderabad, India',
    locationType: 'onsite',
    type: 'full-time',
    description: 'We are building cutting-edge NLP models for our AI-powered recruitment platform. Looking for an ML Engineer with hands-on NLP experience.',
    requirements: ['3+ years of ML/NLP experience', 'Hands-on with LLMs and transformers', 'Experience with Python, PyTorch or TensorFlow', 'Familiarity with LLM APIs'],
    responsibilities: ['Fine-tune and evaluate LLMs for domain-specific tasks', 'Build data pipelines for training and evaluation', 'Integrate AI models into production APIs', 'Research and implement state-of-the-art NLP techniques'],
    skills: ['Python', 'PyTorch', 'NLP', 'LLMs', 'FastAPI', 'Hugging Face'],
    experienceMin: 3, experienceMax: 7,
    salaryMin: 1500000, salaryMax: 2500000, currency: 'INR', status: 'open',
  },
  {
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Pune, India',
    locationType: 'hybrid',
    type: 'full-time',
    description: 'We need a DevOps Engineer to help us scale our infrastructure, automate deployments, and ensure 99.9% uptime for our SaaS platform.',
    requirements: ['3+ years of DevOps/SRE experience', 'Strong knowledge of AWS or GCP', 'Experience with Kubernetes and Docker', 'CI/CD pipeline expertise'],
    responsibilities: ['Manage and scale cloud infrastructure on AWS', 'Set up and maintain CI/CD pipelines', 'Monitor system performance and respond to incidents', 'Implement infrastructure as code using Terraform'],
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux'],
    experienceMin: 3, experienceMax: 7,
    salaryMin: 1000000, salaryMax: 1800000, currency: 'INR', status: 'open',
  },
  {
    title: 'Frontend Developer (React)',
    department: 'Engineering',
    location: 'Remote, India',
    locationType: 'remote',
    type: 'full-time',
    description: 'Looking for a passionate Frontend Developer to build beautiful, performant user interfaces for our recruitment platform.',
    requirements: ['2+ years of React development', 'Strong CSS and Tailwind skills', 'Experience with TypeScript', 'Understanding of web performance optimization'],
    responsibilities: ['Build reusable UI components', 'Implement pixel-perfect designs from Figma', 'Optimize frontend performance', 'Write unit and integration tests'],
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js', 'Jest'],
    experienceMin: 2, experienceMax: 5,
    salaryMin: 700000, salaryMax: 1400000, currency: 'INR', status: 'open',
  },
  {
    title: 'Data Engineer',
    department: 'Data',
    location: 'Bangalore, India',
    locationType: 'hybrid',
    type: 'full-time',
    description: 'Join our data team to build robust data pipelines and analytics infrastructure that powers AI-driven insights across our platform.',
    requirements: ['3+ years of data engineering experience', 'Proficiency in Python and SQL', 'Experience with Apache Spark or Airflow', 'Knowledge of data warehousing concepts'],
    responsibilities: ['Design and maintain ETL/ELT pipelines', 'Build and optimise data models', 'Collaborate with ML team on feature engineering', 'Ensure data quality and reliability'],
    skills: ['Python', 'SQL', 'Apache Spark', 'Airflow', 'dbt', 'BigQuery'],
    experienceMin: 3, experienceMax: 7,
    salaryMin: 1100000, salaryMax: 2000000, currency: 'INR', status: 'open',
  },
  {
    title: 'Product Manager — Growth',
    department: 'Product',
    location: 'Mumbai, India',
    locationType: 'hybrid',
    type: 'full-time',
    description: 'We are hiring a Product Manager to own our growth product area — from onboarding to activation to retention — driving measurable business outcomes.',
    requirements: ['4+ years of product management experience', 'Strong analytical and data-driven mindset', 'Experience with B2B SaaS products', 'Excellent stakeholder communication skills'],
    responsibilities: ['Define product roadmap for growth initiatives', 'Run experiments and A/B tests', 'Work with engineering, design, and marketing', 'Track KPIs and report to leadership'],
    skills: ['Product Strategy', 'A/B Testing', 'Analytics', 'SQL', 'User Research', 'Roadmapping'],
    experienceMin: 4, experienceMax: 8,
    salaryMin: 1500000, salaryMax: 2800000, currency: 'INR', status: 'open',
  },
  {
    title: 'Backend Engineer (Python)',
    department: 'Engineering',
    location: 'Hyderabad, India',
    locationType: 'remote',
    type: 'full-time',
    description: 'Looking for a Backend Engineer with strong Python skills to build APIs and services for our AI-powered platform.',
    requirements: ['3+ years of Python backend experience', 'Strong FastAPI or Django REST experience', 'Database design expertise (PostgreSQL)', 'Experience with message queues (Redis, RabbitMQ)'],
    responsibilities: ['Build and maintain Python microservices', 'Design REST and GraphQL APIs', 'Optimise database queries and performance', 'Write comprehensive tests and documentation'],
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL'],
    experienceMin: 3, experienceMax: 7,
    salaryMin: 1000000, salaryMax: 1900000, currency: 'INR', status: 'paused',
  },
];

// ─── CANDIDATES ───────────────────────────────────────────────────────────────

const CANDIDATES_DATA = [
  {
    name: 'Priya Sharma', email: 'priya.sharma@gmail.com', phone: '+91-9876543210',
    location: 'Bangalore, India', linkedIn: 'https://linkedin.com/in/priyasharma',
    github: 'https://github.com/priyasharma', source: 'upload', tags: ['react', 'nodejs', 'senior'],
    parsedProfile: {
      summary: 'Senior Full Stack Developer with 6 years of experience building scalable SaaS products using React, Node.js, and MongoDB. Led teams of 5+ engineers.',
      skills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker', 'GraphQL'],
      totalExperience: 6,
      experience: [
        { company: 'Flipkart', title: 'Senior SDE', duration: '2021 - Present', description: 'Led development of seller portal handling 10M+ monthly users.' },
        { company: 'Razorpay', title: 'SDE II', duration: '2019 - 2021', description: 'Built payment APIs and dashboard features.' },
      ],
      education: [{ institution: 'IIT Bombay', degree: 'B.Tech', field: 'Computer Science', year: '2018' }],
      keywords: ['React', 'Node.js', 'AWS', 'microservices', 'REST APIs', 'team lead'],
    },
  },
  {
    name: 'Arjun Mehta', email: 'arjun.mehta@outlook.com', phone: '+91-9812345678',
    location: 'Pune, India', github: 'https://github.com/arjunmehta',
    source: 'referral', tags: ['nodejs', 'backend', 'mid-level'],
    parsedProfile: {
      summary: 'Backend developer with 4 years of experience in Node.js and Express. Comfortable with both SQL and NoSQL databases.',
      skills: ['Node.js', 'Express', 'PostgreSQL', 'Redis', 'Docker'],
      totalExperience: 4,
      experience: [
        { company: 'Zomato', title: 'Backend Engineer', duration: '2022 - Present', description: 'Designed and built order management microservices.' },
        { company: 'Infosys', title: 'Software Engineer', duration: '2020 - 2022', description: 'Maintained enterprise Java and Node.js applications.' },
      ],
      education: [{ institution: 'Pune University', degree: 'B.E.', field: 'Information Technology', year: '2020' }],
      keywords: ['Node.js', 'microservices', 'PostgreSQL', 'REST', 'Docker'],
    },
  },
  {
    name: 'Sneha Nair', email: 'sneha.nair@gmail.com', phone: '+91-9823456789',
    location: 'Kerala, India', linkedIn: 'https://linkedin.com/in/snehanair',
    source: 'linkedin', tags: ['design', 'figma', 'ux'],
    parsedProfile: {
      summary: 'Product Designer with 5 years crafting user-centered digital experiences. Specialised in SaaS and fintech design.',
      skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Adobe XD'],
      totalExperience: 5,
      experience: [
        { company: 'CRED', title: 'Senior Product Designer', duration: '2021 - Present', description: 'Owned design for core payments and rewards flows.' },
        { company: 'Swiggy', title: 'UI/UX Designer', duration: '2019 - 2021', description: 'Redesigned the restaurant partner app, improving retention by 30%.' },
      ],
      education: [{ institution: 'NID Ahmedabad', degree: 'M.Des', field: 'Interaction Design', year: '2019' }],
      keywords: ['Figma', 'UX', 'design systems', 'SaaS', 'user research'],
    },
  },
  {
    name: 'Rohan Verma', email: 'rohan.verma@proton.me', phone: '+91-9898989898',
    location: 'Hyderabad, India', github: 'https://github.com/rohanverma',
    source: 'upload', tags: ['python', 'ml', 'nlp'],
    parsedProfile: {
      summary: 'ML Engineer with 4 years specialising in NLP and large language models. Contributed to open-source LLM tooling.',
      skills: ['Python', 'PyTorch', 'NLP', 'Transformers', 'FastAPI', 'LLMs', 'Hugging Face'],
      totalExperience: 4,
      experience: [
        { company: 'Sarvam AI', title: 'ML Engineer', duration: '2022 - Present', description: 'Built and fine-tuned multilingual LLMs for Indian languages.' },
        { company: 'TCS Research', title: 'Research Engineer', duration: '2020 - 2022', description: 'NLP research in document classification and extraction.' },
      ],
      education: [{ institution: 'IIT Hyderabad', degree: 'M.Tech', field: 'AI & ML', year: '2020' }],
      keywords: ['LLMs', 'NLP', 'PyTorch', 'Python', 'fine-tuning', 'RAG'],
    },
  },
  {
    name: 'Kavya Reddy', email: 'kavya.reddy@gmail.com', phone: '+91-9701234567',
    location: 'Chennai, India', linkedIn: 'https://linkedin.com/in/kavyareddy',
    source: 'manual', tags: ['react', 'frontend', 'junior'],
    parsedProfile: {
      summary: 'Frontend developer with 2 years of experience building responsive web apps with React and Tailwind CSS.',
      skills: ['React', 'JavaScript', 'Tailwind CSS', 'HTML', 'CSS', 'Git'],
      totalExperience: 2,
      experience: [
        { company: 'Freshworks', title: 'Frontend Developer', duration: '2023 - Present', description: 'Building internal tooling dashboards with React.' },
      ],
      education: [{ institution: 'Anna University', degree: 'B.E.', field: 'Computer Science', year: '2023' }],
      keywords: ['React', 'JavaScript', 'CSS', 'responsive design'],
    },
  },
  {
    name: 'Vikram Singh', email: 'vikram.singh@gmail.com', phone: '+91-9988776655',
    location: 'Delhi, India', linkedIn: 'https://linkedin.com/in/vikramsingh',
    github: 'https://github.com/vikramsingh', source: 'linkedin', tags: ['devops', 'aws', 'kubernetes'],
    parsedProfile: {
      summary: 'DevOps Engineer with 5 years of experience managing large-scale AWS infrastructure. Expert in Kubernetes and CI/CD automation.',
      skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux', 'Jenkins', 'Prometheus'],
      totalExperience: 5,
      experience: [
        { company: 'Paytm', title: 'Senior DevOps Engineer', duration: '2021 - Present', description: 'Managed Kubernetes clusters serving 50M+ users. Reduced deployment time by 70%.' },
        { company: 'MakeMyTrip', title: 'DevOps Engineer', duration: '2019 - 2021', description: 'Built CI/CD pipelines and automated infrastructure provisioning with Terraform.' },
      ],
      education: [{ institution: 'NIT Trichy', degree: 'B.Tech', field: 'Computer Science', year: '2019' }],
      keywords: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'SRE', 'monitoring'],
    },
  },
  {
    name: 'Ananya Iyer', email: 'ananya.iyer@gmail.com', phone: '+91-9876012345',
    location: 'Bangalore, India', linkedIn: 'https://linkedin.com/in/ananyaiyer',
    source: 'upload', tags: ['python', 'data', 'sql'],
    parsedProfile: {
      summary: 'Data Engineer with 4 years of experience building large-scale data pipelines and analytics platforms. Strong Python and SQL background.',
      skills: ['Python', 'SQL', 'Apache Spark', 'Airflow', 'dbt', 'BigQuery', 'PostgreSQL'],
      totalExperience: 4,
      experience: [
        { company: 'Meesho', title: 'Data Engineer', duration: '2022 - Present', description: 'Built Spark-based ETL pipelines processing 500GB+ daily.' },
        { company: 'Ola', title: 'Junior Data Engineer', duration: '2020 - 2022', description: 'Maintained Airflow DAGs and data warehouse models.' },
      ],
      education: [{ institution: 'BITS Pilani', degree: 'B.E.', field: 'Computer Science', year: '2020' }],
      keywords: ['data pipelines', 'ETL', 'Spark', 'Airflow', 'BigQuery', 'SQL'],
    },
  },
  {
    name: 'Rahul Gupta', email: 'rahul.gupta@outlook.com', phone: '+91-9811223344',
    location: 'Gurgaon, India', linkedIn: 'https://linkedin.com/in/rahulgupta',
    source: 'referral', tags: ['product', 'growth', 'analytics'],
    parsedProfile: {
      summary: 'Product Manager with 5 years driving growth for B2B SaaS products. Data-driven approach with strong experimentation background.',
      skills: ['Product Strategy', 'A/B Testing', 'Analytics', 'SQL', 'User Research', 'Roadmapping', 'Jira'],
      totalExperience: 5,
      experience: [
        { company: 'Zoho', title: 'Senior Product Manager', duration: '2021 - Present', description: 'Owned growth product area, improving activation rate by 40%.' },
        { company: 'Clevertap', title: 'Product Manager', duration: '2019 - 2021', description: 'Built onboarding and retention features for marketing automation platform.' },
      ],
      education: [{ institution: 'IIM Calcutta', degree: 'MBA', field: 'Product & Strategy', year: '2019' }],
      keywords: ['product management', 'growth', 'B2B SaaS', 'A/B testing', 'analytics'],
    },
  },
  {
    name: 'Deepika Patel', email: 'deepika.patel@gmail.com', phone: '+91-9978563412',
    location: 'Ahmedabad, India', github: 'https://github.com/deepikapatel',
    source: 'upload', tags: ['python', 'backend', 'fastapi'],
    parsedProfile: {
      summary: 'Python backend developer with 3 years of experience building high-performance APIs with FastAPI and PostgreSQL.',
      skills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'SQLAlchemy', 'GraphQL'],
      totalExperience: 3,
      experience: [
        { company: 'PhonePe', title: 'Backend Engineer', duration: '2022 - Present', description: 'Built FastAPI microservices for payments infrastructure.' },
        { company: 'Groww', title: 'Software Developer', duration: '2021 - 2022', description: 'Developed Django REST APIs for investment platform.' },
      ],
      education: [{ institution: 'Gujarat University', degree: 'B.Tech', field: 'Information Technology', year: '2021' }],
      keywords: ['FastAPI', 'Python', 'PostgreSQL', 'REST APIs', 'microservices'],
    },
  },
  {
    name: 'Kiran Rao', email: 'kiran.rao@proton.me', phone: '+91-9876543000',
    location: 'Hyderabad, India', linkedIn: 'https://linkedin.com/in/kiranrao',
    source: 'linkedin', tags: ['react', 'nextjs', 'typescript'],
    parsedProfile: {
      summary: 'Frontend developer with 3 years of experience specialising in React and Next.js. Passionate about performance and accessibility.',
      skills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GraphQL', 'Jest'],
      totalExperience: 3,
      experience: [
        { company: 'Urban Company', title: 'Frontend Developer', duration: '2022 - Present', description: 'Built consumer-facing Next.js application with 2M+ monthly users.' },
        { company: 'WazirX', title: 'React Developer', duration: '2021 - 2022', description: 'Developed crypto trading dashboard with real-time price updates.' },
      ],
      education: [{ institution: 'Osmania University', degree: 'B.E.', field: 'Computer Science', year: '2021' }],
      keywords: ['React', 'Next.js', 'TypeScript', 'frontend', 'performance'],
    },
  },
  {
    name: 'Siddharth Joshi', email: 'siddharth.joshi@gmail.com', phone: '+91-9823001234',
    location: 'Pune, India', github: 'https://github.com/siddharthjoshi',
    source: 'manual', tags: ['ml', 'computer-vision', 'python'],
    parsedProfile: {
      summary: 'ML Engineer with 3 years of experience in computer vision and NLP. Built production ML pipelines serving millions of requests daily.',
      skills: ['Python', 'TensorFlow', 'PyTorch', 'OpenCV', 'NLP', 'MLflow', 'Docker'],
      totalExperience: 3,
      experience: [
        { company: 'Jio', title: 'ML Engineer', duration: '2022 - Present', description: 'Built computer vision models for content moderation at scale.' },
        { company: 'Persistent Systems', title: 'AI Engineer', duration: '2021 - 2022', description: 'Developed NLP models for document processing.' },
      ],
      education: [{ institution: 'Pune University', degree: 'M.Tech', field: 'AI & ML', year: '2021' }],
      keywords: ['computer vision', 'NLP', 'TensorFlow', 'PyTorch', 'MLOps'],
    },
  },
  {
    name: 'Nisha Kapoor', email: 'nisha.kapoor@outlook.com', phone: '+91-9911223300',
    location: 'Delhi, India', linkedIn: 'https://linkedin.com/in/nishakapoor',
    source: 'linkedin', tags: ['design', 'branding', 'motion'],
    parsedProfile: {
      summary: 'Product Designer with 4 years of experience across product design, branding, and motion design. Expert in Figma and After Effects.',
      skills: ['Figma', 'Adobe XD', 'After Effects', 'Illustrator', 'User Research', 'Prototyping'],
      totalExperience: 4,
      experience: [
        { company: 'Nykaa', title: 'Product Designer', duration: '2021 - Present', description: 'Led redesign of the shopping experience, improving conversion by 25%.' },
        { company: 'Dentsu', title: 'UI Designer', duration: '2020 - 2021', description: 'Created brand identities and digital assets for enterprise clients.' },
      ],
      education: [{ institution: 'Pearl Academy', degree: 'B.Des', field: 'Communication Design', year: '2020' }],
      keywords: ['product design', 'UI/UX', 'Figma', 'branding', 'motion design'],
    },
  },
  {
    name: 'Amit Bose', email: 'amit.bose@gmail.com', phone: '+91-9734561234',
    location: 'Kolkata, India', github: 'https://github.com/amitbose',
    source: 'upload', tags: ['devops', 'gcp', 'terraform'],
    parsedProfile: {
      summary: 'DevOps Engineer with 3 years of experience focusing on GCP and Kubernetes. Strong background in infrastructure as code.',
      skills: ['GCP', 'Kubernetes', 'Terraform', 'Docker', 'Python', 'CI/CD', 'Ansible'],
      totalExperience: 3,
      experience: [
        { company: 'Byju\'s', title: 'DevOps Engineer', duration: '2022 - Present', description: 'Managed GKE clusters and built Terraform modules for infrastructure.' },
        { company: 'Cognizant', title: 'Cloud Engineer', duration: '2021 - 2022', description: 'Automated cloud deployments on GCP and AWS.' },
      ],
      education: [{ institution: 'Jadavpur University', degree: 'B.Tech', field: 'Computer Science', year: '2021' }],
      keywords: ['GCP', 'Kubernetes', 'Terraform', 'DevOps', 'cloud infrastructure'],
    },
  },
  {
    name: 'Pooja Desai', email: 'pooja.desai@gmail.com', phone: '+91-9823456700',
    location: 'Mumbai, India', linkedIn: 'https://linkedin.com/in/poojadesai',
    source: 'referral', tags: ['product', 'saas', 'b2b'],
    parsedProfile: {
      summary: 'Product Manager with 3 years in early-stage B2B SaaS. Experienced in zero-to-one product development and customer discovery.',
      skills: ['Product Strategy', 'User Research', 'SQL', 'Analytics', 'Figma', 'Notion'],
      totalExperience: 3,
      experience: [
        { company: 'Darwinbox', title: 'Product Manager', duration: '2022 - Present', description: 'Built core HR modules from scratch, onboarding 50+ enterprise clients.' },
        { company: 'Belong.co', title: 'Associate PM', duration: '2021 - 2022', description: 'Worked on candidate experience features for ATS product.' },
      ],
      education: [{ institution: 'SP Jain', degree: 'PGDM', field: 'Marketing & Strategy', year: '2021' }],
      keywords: ['B2B SaaS', 'product management', 'user research', 'enterprise', 'HR tech'],
    },
  },
  {
    name: 'Varun Tiwari', email: 'varun.tiwari@proton.me', phone: '+91-9955443322',
    location: 'Bangalore, India', github: 'https://github.com/varuntiwari',
    source: 'upload', tags: ['data', 'spark', 'python'],
    parsedProfile: {
      summary: 'Data Engineer with 5 years of experience building large-scale real-time data pipelines. Expert in Spark, Kafka, and cloud data warehouses.',
      skills: ['Python', 'Apache Spark', 'Kafka', 'Airflow', 'Snowflake', 'dbt', 'SQL', 'BigQuery'],
      totalExperience: 5,
      experience: [
        { company: 'Swiggy', title: 'Senior Data Engineer', duration: '2021 - Present', description: 'Built real-time data pipelines processing 1M+ orders per day.' },
        { company: 'Mu Sigma', title: 'Data Engineer', duration: '2019 - 2021', description: 'Developed batch ETL pipelines for retail analytics.' },
      ],
      education: [{ institution: 'IIT Roorkee', degree: 'B.Tech', field: 'Computer Science', year: '2019' }],
      keywords: ['Spark', 'Kafka', 'data pipelines', 'real-time', 'Snowflake', 'dbt'],
    },
  },
];

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────
// Format: { jobIdx, candidateIdx, stage, isShortlisted, aiScore }

const APPLICATIONS_DATA = [
  // ── Job 0: Senior Full Stack Developer ──────────────────────────────
  {
    jobIdx: 0, candidateIdx: 0, stage: 'interview', isShortlisted: true,
    aiScore: {
      overall: 91, skillMatch: 95, experienceMatch: 88, educationMatch: 90,
      explanation: 'Priya is an excellent fit. She has 6 years of direct experience with React, Node.js, TypeScript, and MongoDB — all core requirements. Her leadership at Flipkart mirrors the role responsibilities closely.',
      matchedSkills: ['React', 'Node.js', 'TypeScript', 'MongoDB', 'AWS', 'Docker'],
      missingSkills: [],
      recommendation: 'strong_yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 0, candidateIdx: 1, stage: 'screening', isShortlisted: true,
    aiScore: {
      overall: 74, skillMatch: 70, experienceMatch: 80, educationMatch: 72,
      explanation: 'Arjun has solid backend Node.js experience and meets seniority. However, his React skills are limited and he lacks TypeScript and AWS.',
      matchedSkills: ['Node.js', 'Docker', 'PostgreSQL'],
      missingSkills: ['React', 'TypeScript', 'AWS'],
      recommendation: 'yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 0, candidateIdx: 4, stage: 'applied', isShortlisted: false,
    aiScore: {
      overall: 42, skillMatch: 50, experienceMatch: 28, educationMatch: 55,
      explanation: 'Kavya has frontend React skills but only 2 years against the 4+ requirement. Lacks backend Node.js and cloud experience.',
      matchedSkills: ['React', 'JavaScript'],
      missingSkills: ['Node.js', 'TypeScript', 'AWS', 'Docker', 'MongoDB'],
      recommendation: 'no', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 0, candidateIdx: 9, stage: 'offer', isShortlisted: true,
    aiScore: {
      overall: 83, skillMatch: 88, experienceMatch: 78, educationMatch: 80,
      explanation: 'Kiran has strong React and Next.js skills with TypeScript. 3 years experience is slightly below the 4+ requirement but the quality of experience at Urban Company is excellent.',
      matchedSkills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'GraphQL'],
      missingSkills: ['MongoDB', 'AWS', 'Docker'],
      recommendation: 'yes', scoredAt: new Date(),
    },
  },

  // ── Job 1: Product Designer ──────────────────────────────────────────
  {
    jobIdx: 1, candidateIdx: 2, stage: 'offer', isShortlisted: true,
    aiScore: {
      overall: 95, skillMatch: 98, experienceMatch: 90, educationMatch: 95,
      explanation: 'Sneha is a near-perfect match. Her 5 years in product design at CRED and Swiggy, combined with an M.Des from NID, precisely match this role.',
      matchedSkills: ['Figma', 'User Research', 'Prototyping', 'Design Systems', 'Adobe XD'],
      missingSkills: [],
      recommendation: 'strong_yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 1, candidateIdx: 11, stage: 'interview', isShortlisted: true,
    aiScore: {
      overall: 79, skillMatch: 82, experienceMatch: 75, educationMatch: 78,
      explanation: 'Nisha has strong design skills and 4 years of experience. Her motion design background is a bonus. Slightly less SaaS-specific experience than Sneha.',
      matchedSkills: ['Figma', 'Adobe XD', 'User Research', 'Prototyping'],
      missingSkills: ['Design Systems', 'Tailwind CSS'],
      recommendation: 'yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 1, candidateIdx: 4, stage: 'rejected', isShortlisted: false,
    aiScore: {
      overall: 35, skillMatch: 30, experienceMatch: 40, educationMatch: 38,
      explanation: 'Kavya is a frontend developer, not a product designer. Her skills in React and CSS are not relevant to a design role requiring Figma and user research.',
      matchedSkills: ['CSS'],
      missingSkills: ['Figma', 'User Research', 'Design Systems', 'Prototyping'],
      recommendation: 'no', scoredAt: new Date(),
    },
  },

  // ── Job 2: ML Engineer NLP ───────────────────────────────────────────
  {
    jobIdx: 2, candidateIdx: 3, stage: 'screening', isShortlisted: true,
    aiScore: {
      overall: 88, skillMatch: 92, experienceMatch: 82, educationMatch: 88,
      explanation: 'Rohan has exactly the NLP and LLM background required. His work at Sarvam AI and M.Tech from IIT Hyderabad make him a strong candidate.',
      matchedSkills: ['Python', 'PyTorch', 'NLP', 'LLMs', 'FastAPI', 'Hugging Face', 'Transformers'],
      missingSkills: ['TensorFlow'],
      recommendation: 'strong_yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 2, candidateIdx: 10, stage: 'applied', isShortlisted: true,
    aiScore: {
      overall: 76, skillMatch: 80, experienceMatch: 72, educationMatch: 75,
      explanation: 'Siddharth has solid ML experience with both computer vision and NLP. His TensorFlow expertise fills a gap. 3 years is slightly under requirement.',
      matchedSkills: ['Python', 'PyTorch', 'TensorFlow', 'NLP', 'Docker'],
      missingSkills: ['Hugging Face', 'LLMs', 'FastAPI'],
      recommendation: 'yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 2, candidateIdx: 6, stage: 'rejected', isShortlisted: false,
    aiScore: {
      overall: 38, skillMatch: 35, experienceMatch: 45, educationMatch: 40,
      explanation: 'Ananya is a Data Engineer, not an ML Engineer. While she has Python skills, she lacks the NLP, PyTorch, and LLM experience required for this role.',
      matchedSkills: ['Python'],
      missingSkills: ['PyTorch', 'NLP', 'LLMs', 'Transformers', 'Hugging Face'],
      recommendation: 'no', scoredAt: new Date(),
    },
  },

  // ── Job 3: DevOps Engineer ───────────────────────────────────────────
  {
    jobIdx: 3, candidateIdx: 5, stage: 'hired', isShortlisted: true,
    aiScore: {
      overall: 93, skillMatch: 96, experienceMatch: 90, educationMatch: 88,
      explanation: 'Vikram is an outstanding match. His 5 years of DevOps experience at Paytm and MakeMyTrip, with deep AWS, Kubernetes, and Terraform expertise, is exactly what this role demands.',
      matchedSkills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'CI/CD', 'Linux'],
      missingSkills: [],
      recommendation: 'strong_yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 3, candidateIdx: 12, stage: 'interview', isShortlisted: true,
    aiScore: {
      overall: 71, skillMatch: 75, experienceMatch: 68, educationMatch: 72,
      explanation: 'Amit has good DevOps skills with GCP focus. The role requires AWS expertise which he lacks. Kubernetes and Terraform experience are solid.',
      matchedSkills: ['Kubernetes', 'Docker', 'Terraform', 'CI/CD'],
      missingSkills: ['AWS', 'Linux expertise', 'Jenkins'],
      recommendation: 'yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 3, candidateIdx: 1, stage: 'rejected', isShortlisted: false,
    aiScore: {
      overall: 28, skillMatch: 25, experienceMatch: 35, educationMatch: 30,
      explanation: 'Arjun is a backend developer with no DevOps experience. While he has Docker knowledge, he lacks AWS, Kubernetes, Terraform, and CI/CD pipeline expertise.',
      matchedSkills: ['Docker'],
      missingSkills: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux'],
      recommendation: 'no', scoredAt: new Date(),
    },
  },

  // ── Job 4: Frontend Developer ────────────────────────────────────────
  {
    jobIdx: 4, candidateIdx: 9, stage: 'interview', isShortlisted: true,
    aiScore: {
      overall: 89, skillMatch: 92, experienceMatch: 85, educationMatch: 88,
      explanation: 'Kiran is an excellent fit for this frontend role. React, Next.js, TypeScript, and Tailwind CSS — she has every required skill with 3 years of proven experience.',
      matchedSkills: ['React', 'Next.js', 'TypeScript', 'Tailwind CSS', 'Jest'],
      missingSkills: [],
      recommendation: 'strong_yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 4, candidateIdx: 4, stage: 'screening', isShortlisted: true,
    aiScore: {
      overall: 67, skillMatch: 70, experienceMatch: 62, educationMatch: 68,
      explanation: 'Kavya has the right tech stack but lacks TypeScript and Next.js experience. 2 years of experience meets the minimum requirement.',
      matchedSkills: ['React', 'JavaScript', 'Tailwind CSS'],
      missingSkills: ['TypeScript', 'Next.js', 'Jest'],
      recommendation: 'maybe', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 4, candidateIdx: 0, stage: 'applied', isShortlisted: false,
    aiScore: {
      overall: 62, skillMatch: 65, experienceMatch: 80, educationMatch: 55,
      explanation: 'Priya is overqualified for this role. Her experience is primarily full-stack senior level, which is above what a frontend developer position requires.',
      matchedSkills: ['React', 'TypeScript', 'Node.js'],
      missingSkills: ['Next.js focus', 'Jest'],
      recommendation: 'maybe', scoredAt: new Date(),
    },
  },

  // ── Job 5: Data Engineer ─────────────────────────────────────────────
  {
    jobIdx: 5, candidateIdx: 14, stage: 'offer', isShortlisted: true,
    aiScore: {
      overall: 96, skillMatch: 98, experienceMatch: 94, educationMatch: 92,
      explanation: 'Varun is an exceptional match. 5 years of data engineering with Spark, Kafka, Airflow, and dbt — every required tool covered. His IIT Roorkee degree is a strong plus.',
      matchedSkills: ['Python', 'Apache Spark', 'Airflow', 'dbt', 'BigQuery', 'SQL'],
      missingSkills: [],
      recommendation: 'strong_yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 5, candidateIdx: 6, stage: 'screening', isShortlisted: true,
    aiScore: {
      overall: 82, skillMatch: 85, experienceMatch: 78, educationMatch: 80,
      explanation: 'Ananya has strong data engineering skills with Spark and Airflow. Her experience at Meesho is very relevant. 4 years meets the requirement well.',
      matchedSkills: ['Python', 'Apache Spark', 'Airflow', 'dbt', 'BigQuery', 'PostgreSQL', 'SQL'],
      missingSkills: ['Kafka', 'Snowflake'],
      recommendation: 'yes', scoredAt: new Date(),
    },
  },

  // ── Job 6: Product Manager ───────────────────────────────────────────
  {
    jobIdx: 6, candidateIdx: 7, stage: 'interview', isShortlisted: true,
    aiScore: {
      overall: 87, skillMatch: 89, experienceMatch: 85, educationMatch: 88,
      explanation: 'Rahul has exactly the growth PM background required. 5 years at Zoho and Clevertap, strong in A/B testing and analytics, IIM Calcutta MBA.',
      matchedSkills: ['Product Strategy', 'A/B Testing', 'Analytics', 'SQL', 'User Research', 'Roadmapping'],
      missingSkills: [],
      recommendation: 'strong_yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 6, candidateIdx: 13, stage: 'screening', isShortlisted: true,
    aiScore: {
      overall: 71, skillMatch: 73, experienceMatch: 68, educationMatch: 74,
      explanation: 'Pooja has good product sense with HR tech experience which is directly relevant. 3 years is slightly below the 4+ requirement.',
      matchedSkills: ['Product Strategy', 'User Research', 'SQL', 'Analytics'],
      missingSkills: ['A/B Testing', 'Roadmapping tools', 'Growth focus'],
      recommendation: 'yes', scoredAt: new Date(),
    },
  },

  // ── Job 7: Backend Engineer (Python) ─────────────────────────────────
  {
    jobIdx: 7, candidateIdx: 8, stage: 'screening', isShortlisted: true,
    aiScore: {
      overall: 85, skillMatch: 90, experienceMatch: 80, educationMatch: 82,
      explanation: 'Deepika is a strong match for this Python backend role. FastAPI, PostgreSQL, Redis, and Docker — all required skills present. Her PhonePe experience is directly relevant.',
      matchedSkills: ['Python', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker', 'GraphQL'],
      missingSkills: ['RabbitMQ', 'message queue depth'],
      recommendation: 'strong_yes', scoredAt: new Date(),
    },
  },
  {
    jobIdx: 7, candidateIdx: 3, stage: 'applied', isShortlisted: false,
    aiScore: {
      overall: 55, skillMatch: 58, experienceMatch: 60, educationMatch: 50,
      explanation: 'Rohan has Python skills but his focus is ML/NLP rather than backend API development. Lacks PostgreSQL and Redis experience.',
      matchedSkills: ['Python', 'FastAPI', 'Docker'],
      missingSkills: ['PostgreSQL', 'Redis', 'GraphQL', 'SQLAlchemy'],
      recommendation: 'maybe', scoredAt: new Date(),
    },
  },
];

// ─── INTERVIEWS ───────────────────────────────────────────────────────────────

// defined after applications are created in seed()

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function seed() {
  const MONGO_URI =
    process.env.MONGODB_URI ||
    'mongodb://admin:secret@localhost:27017/smartats?authSource=admin';

  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Smart ATS — Enhanced Demo Data Seeder      ║');
  console.log('╚══════════════════════════════════════════════╝\n');

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
    if (existing) { log.skip(`${u.role} — ${u.email}`); userMap[u.role] = existing; continue; }
    const hash = await bcrypt.hash(u.password, 12);
    const user = await User.create({ name: u.name, email: u.email, password: hash, role: u.role, isActive: true });
    userMap[u.role] = user;
    log.info(`${u.role} — ${u.email} / ${u.password}`);
  }

  // ── 2. Jobs ────────────────────────────────────────────────────────────────
  log.section('Creating jobs');
  const jobs = [];
  for (const j of JOBS_DATA) {
    const existing = await Job.findOne({ title: j.title });
    if (existing) { log.skip(j.title); jobs.push(existing); continue; }
    const job = await Job.create({ ...j, postedBy: userMap['recruiter']._id, hiringManager: userMap['hiring_manager']._id });
    jobs.push(job);
    log.info(j.title);
  }

  // ── 3. Candidates ──────────────────────────────────────────────────────────
  log.section('Creating candidates');
  const candidates = [];
  for (const c of CANDIDATES_DATA) {
    const fingerprint = fp(c.name, c.email);
    const existing = await Candidate.findOne({ fingerprint });
    if (existing) { log.skip(c.name); candidates.push(existing); continue; }
    const candidate = await Candidate.create({ ...c, fingerprint, addedBy: userMap['recruiter']._id });
    candidates.push(candidate);
    log.info(c.name);
  }

  // ── 4. Applications ────────────────────────────────────────────────────────
  log.section('Creating applications');
  const applicationDocs = [];
  for (const a of APPLICATIONS_DATA) {
    const job = jobs[a.jobIdx];
    const candidate = candidates[a.candidateIdx];
    if (!job || !candidate) continue;

    const existing = await Application.findOne({ job: job._id, candidate: candidate._id });
    if (existing) { log.skip(`${candidate.name} → ${job.title}`); applicationDocs.push(existing); continue; }

    const app = await Application.create({
      job: job._id,
      candidate: candidate._id,
      stage: a.stage,
      isShortlisted: a.isShortlisted,
      aiScore: a.aiScore,
      submittedBy: userMap['recruiter']._id,
      stageHistory: [{ stage: a.stage, changedBy: userMap['recruiter']._id, note: 'Seeded' }],
    });

    await Job.findByIdAndUpdate(job._id, {
      $inc: { totalApplications: 1, [`pipeline.${a.stage}`]: 1 },
    });

    applicationDocs.push(app);
    log.info(`${candidate.name} → ${job.title} [${a.stage}, score: ${a.aiScore.overall}]`);
  }

  // ── 5. Interviews ──────────────────────────────────────────────────────────
  log.section('Creating interviews');

  const interviewScenarios = [
    {
      // Priya → Senior Full Stack (upcoming technical interview)
      findApp: (apps) => apps.find((a) => {
        const c = candidates.find((x) => x._id.equals(a.candidate));
        const j = jobs.find((x) => x._id.equals(a.job));
        return c?.name === 'Priya Sharma' && j?.title === 'Senior Full Stack Developer';
      }),
      type: 'technical', round: 2, daysFromNow: 3, hour: 11,
      mode: 'video', meetingLink: 'https://meet.google.com/priya-tech-interview',
      status: 'scheduled',
    },
    {
      // Sneha → Product Designer (HR round — completed with feedback)
      findApp: (apps) => apps.find((a) => {
        const c = candidates.find((x) => x._id.equals(a.candidate));
        const j = jobs.find((x) => x._id.equals(a.job));
        return c?.name === 'Sneha Nair' && j?.title === 'Product Designer (UI/UX)';
      }),
      type: 'hr', round: 1, daysFromNow: -5, hour: 14,
      mode: 'video', meetingLink: 'https://meet.google.com/sneha-hr-round',
      status: 'completed',
      feedback: {
        rating: 5,
        notes: 'Sneha was exceptional. Strong portfolio, clear design thinking, and excellent communication. Highly recommend for offer.',
        recommendation: 'hire',
      },
    },
    {
      // Vikram → DevOps (panel interview — completed, hired)
      findApp: (apps) => apps.find((a) => {
        const c = candidates.find((x) => x._id.equals(a.candidate));
        const j = jobs.find((x) => x._id.equals(a.job));
        return c?.name === 'Vikram Singh' && j?.title === 'DevOps Engineer';
      }),
      type: 'panel', round: 3, daysFromNow: -10, hour: 10,
      mode: 'video', meetingLink: 'https://meet.google.com/vikram-panel',
      status: 'completed',
      feedback: {
        rating: 5,
        notes: 'Vikram demonstrated deep AWS and Kubernetes expertise. Excellent problem-solving during the live infra scenario. Strong hire.',
        recommendation: 'hire',
      },
    },
    {
      // Nisha → Product Designer (technical screen — upcoming)
      findApp: (apps) => apps.find((a) => {
        const c = candidates.find((x) => x._id.equals(a.candidate));
        const j = jobs.find((x) => x._id.equals(a.job));
        return c?.name === 'Nisha Kapoor' && j?.title === 'Product Designer (UI/UX)';
      }),
      type: 'phone_screen', round: 1, daysFromNow: 1, hour: 15,
      mode: 'phone',
      status: 'scheduled',
    },
    {
      // Rahul → Product Manager (final round — upcoming)
      findApp: (apps) => apps.find((a) => {
        const c = candidates.find((x) => x._id.equals(a.candidate));
        const j = jobs.find((x) => x._id.equals(a.job));
        return c?.name === 'Rahul Gupta' && j?.title === 'Product Manager — Growth';
      }),
      type: 'final', round: 3, daysFromNow: 5, hour: 16,
      mode: 'in_person', location: 'TalentFlow HQ, Mumbai — Conference Room B',
      status: 'scheduled',
    },
  ];

  for (const scenario of interviewScenarios) {
    const app = scenario.findApp(applicationDocs);
    if (!app) { log.skip('Interview scenario — application not found'); continue; }

    const existingInterview = await Interview.findOne({ application: app._id });
    if (existingInterview) { log.skip(`Interview for application ${app._id}`); continue; }

    const scheduledAt = new Date();
    scheduledAt.setDate(scheduledAt.getDate() + scenario.daysFromNow);
    scheduledAt.setHours(scenario.hour, 0, 0, 0);

    const interviewData = {
      application: app._id,
      job: app.job,
      candidate: app.candidate,
      type: scenario.type,
      round: scenario.round,
      scheduledAt,
      duration: 60,
      timezone: 'Asia/Kolkata',
      mode: scenario.mode,
      meetingLink: scenario.meetingLink,
      location: scenario.location,
      interviewers: [userMap['hiring_manager']._id],
      scheduledBy: userMap['recruiter']._id,
      status: scenario.status,
    };

    if (scenario.feedback) {
      interviewData.feedback = {
        ...scenario.feedback,
        submittedBy: userMap['hiring_manager']._id,
        submittedAt: new Date(scheduledAt.getTime() + 90 * 60 * 1000),
      };
    }

    await Interview.create(interviewData);

    const candidateName = candidates.find((c) => c._id.equals(app.candidate))?.name || 'Candidate';
    log.info(`${scenario.type} interview for ${candidateName} [${scenario.status}]`);
  }

  // ── 6. Notifications ───────────────────────────────────────────────────────
  log.section('Creating notifications');

  const notificationsData = [
    {
      role: 'recruiter',
      type: 'new_application',
      title: '🆕 New Application — Senior Full Stack Developer',
      message: 'Priya Sharma has applied for Senior Full Stack Developer. AI score: 91/100.',
      link: '/applications',
    },
    {
      role: 'recruiter',
      type: 'ai_score_ready',
      title: '🤖 AI Scores Ready — 5 Applications',
      message: 'AI scoring completed for 5 new applications across 3 jobs.',
      link: '/applications',
    },
    {
      role: 'hiring_manager',
      type: 'interview_scheduled',
      title: '📅 Interview Scheduled — Priya Sharma',
      message: 'Technical interview for Priya Sharma scheduled in 3 days at 11:00 AM.',
      link: '/interviews',
    },
    {
      role: 'hiring_manager',
      type: 'shortlisted',
      title: '⭐ Candidate Shortlisted — Vikram Singh',
      message: 'Vikram Singh has been shortlisted for DevOps Engineer with an AI score of 93/100.',
      link: '/candidates',
    },
    {
      role: 'admin',
      type: 'candidate_hired',
      title: '🎉 Candidate Hired — Vikram Singh',
      message: 'Vikram Singh has been successfully hired for the DevOps Engineer role.',
      link: '/applications',
    },
    {
      role: 'recruiter',
      type: 'stage_changed',
      title: '📋 Pipeline Update — Sneha Nair',
      message: 'Sneha Nair moved to Offer stage for Product Designer role.',
      link: '/applications',
    },
    {
      role: 'admin',
      type: 'job_posted',
      title: '👋 Welcome to TalentFlow AI',
      message: 'Your demo workspace is ready. 8 jobs, 15 candidates, and 20+ applications have been loaded. Explore AI scoring and shortlisting features!',
      link: '/dashboard',
    },
  ];

  for (const n of notificationsData) {
    const user = userMap[n.role];
    if (!user) continue;
    const exists = await Notification.findOne({ user: user._id, title: n.title });
    if (exists) { log.skip(`Notification: ${n.title}`); continue; }
    await Notification.create({ user: user._id, type: n.type, title: n.title, message: n.message, link: n.link });
    log.info(`Notification → ${n.role}: ${n.title}`);
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  log.done('Seeding complete!\n');
  console.log('─────────────────────────────────────────────────────');
  console.log('  Demo workspace summary:');
  console.log(`  • ${JOBS_DATA.length} jobs (7 open, 1 paused)`);
  console.log(`  • ${CANDIDATES_DATA.length} candidates across Engineering, Design, ML, DevOps, Data, Product`);
  console.log(`  • ${APPLICATIONS_DATA.length} applications spread across all pipeline stages`);
  console.log('  • 5 interviews (2 upcoming, 2 completed with feedback, 1 cancelled)');
  console.log('');
  console.log('  Login credentials:');
  console.log('');
  for (const u of USERS) {
    console.log(`  ${u.role.padEnd(15)}  ${u.email}  /  ${u.password}`);
  }
  console.log('');
  console.log('  Frontend:  http://localhost:3000');
  console.log('  API:       http://localhost:5000');
  console.log('  AI:        http://localhost:8000');
  console.log('─────────────────────────────────────────────────────\n');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('\n✖ Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});
