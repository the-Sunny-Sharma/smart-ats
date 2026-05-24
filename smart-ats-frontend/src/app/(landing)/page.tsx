export const dynamic = 'force-dynamic';

import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TalentFlow AI — Hire Smarter with AI',
  description: 'AI-Powered Hiring. Smarter Decisions. Better Teams.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen landing-root">

      {/* ── Nav ── */}
      <nav className="landing-nav">
        <div className="landing-container landing-nav-inner">
          <div className="landing-logo">
            <div className="landing-logo-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="landing-logo-text">TalentFlow <span style={{ color: '#818cf8' }}>AI</span></span>
          </div>

          <div className="landing-nav-links">
            <a href="#features" className="landing-nav-link hover-white">Features</a>
            <a href="#pricing"  className="landing-nav-link hover-white">Pricing</a>
            <a href="#comparison" className="landing-nav-link hover-white">Compare</a>
            <Link href="/docs" target="_blank" rel="noopener noreferrer" className="landing-nav-link hover-white">
              API Docs
            </Link>
          </div>

          <div className="landing-nav-cta">
            <Link href="/login" className="landing-nav-link hover-white">Sign in</Link>
            <Link href="/register" className="landing-cta-btn">
              <span className="landing-cta-btn-long">Start Hiring Today</span>
              <span className="landing-cta-btn-short">Start Free</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <div className="landing-hero-glow" />
        <div className="landing-hero-inner">
          <div className="landing-badge">
            <span className="landing-badge-dot" />
            Limited Early Access Available
          </div>
          <h1 className="landing-h1">
            Hire Smarter<br />
            <span className="landing-gradient-text">with AI</span>
          </h1>
          <p className="landing-subheading">Transform Your Recruitment Process</p>
          <p className="landing-body">
            AI-Powered Hiring. Smarter Decisions. Better Teams.<br className="landing-br-hide" />
            Find the Best Talent Faster with semantic matching, explainable AI scoring, and automated workflows.
          </p>
          <div className="landing-hero-btns">
            <Link href="/register" className="landing-primary-btn">Start Hiring Today →</Link>
            <Link href="/login"    className="landing-ghost-btn">View Demo</Link>
          </div>
          <p className="landing-fine-print">No credit card required · Free tier available · Setup in 5 minutes</p>
        </div>
      </section>

      {/* ── Stats ── */}
      <div className="landing-stats-bar">
        <div className="landing-container landing-stats-grid">
          {[
            { num: '10x',  label: 'Faster screening' },
            { num: '94%',  label: 'Match accuracy' },
            { num: '3hrs', label: 'Saved per hire' },
            { num: '500+', label: 'Teams onboarded' },
          ].map(({ num, label }) => (
            <div key={num} className="landing-stat-item">
              <p className="landing-stat-num">{num}</p>
              <p className="landing-stat-label">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Features ── */}
      <section id="features" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-h2">Everything you need to hire smarter</h2>
            <p className="landing-section-sub">
              Premium gives your team AI superpowers — free tier gives you the foundation.
            </p>
          </div>
          <div className="landing-features-grid">
            {[
              { icon: '🧠', title: 'AI Resume Parsing',          desc: 'Automatically extract skills, experience, education, and contact info from any resume in seconds.',               premium: true  },
              { icon: '🎯', title: 'Semantic Candidate Scoring', desc: '0–100 fit score with explainable breakdown — skill match, experience match, education match.',                   premium: true  },
              { icon: '⚡', title: 'Smart Shortlisting',         desc: 'AI recommends the top candidates for each role so you focus your time where it matters.',                         premium: true  },
              { icon: '📋', title: 'Job Pipeline Kanban',        desc: 'Visual drag-and-drop pipeline from application to hire. Full stage history tracking.',                            premium: false },
              { icon: '📅', title: 'Interview Scheduling',       desc: 'One-click scheduling with automated email notifications to candidates and interviewers.',                          premium: false },
              { icon: '📊', title: 'Recruitment Analytics',      desc: 'Full-funnel metrics, time-to-hire, pipeline conversion rates, and hiring trends.',                               premium: false },
            ].map(({ icon, title, desc, premium }) => (
              <div key={title} className={`landing-feature-card${premium ? ' landing-feature-card-premium' : ''}`}>
                {premium && <span className="landing-premium-badge">PREMIUM</span>}
                <div className="landing-feature-icon">{icon}</div>
                <h3 className="landing-feature-title">{title}</h3>
                <p className="landing-feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section id="comparison" className="landing-comparison-section">
        <div className="landing-container landing-comparison-inner">
          <h2 className="landing-h2" style={{ textAlign: 'center', marginBottom: '3rem' }}>Free vs Premium</h2>
          <div className="landing-comparison-table">
            <div className="landing-comparison-header">
              <div className="landing-comparison-cell landing-comparison-feature-header">Feature</div>
              <div className="landing-comparison-cell landing-comparison-col-header">Free</div>
              <div className="landing-comparison-cell landing-comparison-col-header landing-comparison-premium-header">Premium ✨</div>
            </div>
            {[
              ['Job postings',               '✅', '✅'],
              ['Candidate management',        '✅', '✅'],
              ['Pipeline tracking',           '✅', '✅'],
              ['Interview scheduling',        '✅', '✅'],
              ['Basic analytics',             '✅', '✅'],
              ['AI resume parsing',           '❌', '✅'],
              ['AI fit scoring (0–100)',       '❌', '✅'],
              ['Explainable recommendations', '❌', '✅'],
              ['Smart shortlisting',          '❌', '✅'],
              ['Keyword extraction',          '❌', '✅'],
              ['Duplicate detection',         '❌', '✅'],
              ['Full analytics + trends',     '❌', '✅'],
            ].map(([feature, free, premium], i) => (
              <div key={i} className={`landing-comparison-row${i % 2 === 0 ? ' landing-comparison-row-even' : ''}`}>
                <div className="landing-comparison-cell landing-comparison-feature">{feature}</div>
                <div className="landing-comparison-cell landing-comparison-value">{free}</div>
                <div className="landing-comparison-cell landing-comparison-value landing-comparison-premium-col">{premium}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <h2 className="landing-h2">Simple, transparent pricing</h2>
            <p className="landing-section-sub">Start free, upgrade when you&apos;re ready</p>
          </div>
          <div className="landing-pricing-grid">
            <div className="landing-pricing-card">
              <h3 className="landing-pricing-name">Free</h3>
              <div className="landing-pricing-price">₹0<span className="landing-pricing-period">/mo</span></div>
              <p className="landing-pricing-tagline">Manual ATS forever</p>
              <Link href="/register" className="landing-pricing-free-btn">Get started free</Link>
            </div>
            <div className="landing-pricing-card landing-pricing-card-premium">
              <div className="landing-most-popular">MOST POPULAR</div>
              <h3 className="landing-pricing-name">Premium</h3>
              <div className="landing-pricing-price">₹999<span className="landing-pricing-period">/mo</span></div>
              <p className="landing-pricing-tagline" style={{ color: '#94a3b8' }}>Full AI-powered hiring suite</p>
              <Link href="/register?plan=premium" className="landing-pricing-premium-btn">Upgrade to Premium →</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-cta-section">
        <div className="landing-hero-glow" style={{ opacity: 0.7 }} />
        <div className="landing-cta-inner">
          <div className="landing-badge">🔥 Limited Early Access Available</div>
          <h2 className="landing-h2">Ready to find the best<br />talent faster?</h2>
          <p className="landing-cta-body">
            Join hundreds of teams already hiring smarter with AI-Powered Hiring. Smarter Decisions. Better Teams.
          </p>
          <Link href="/register" className="landing-primary-btn landing-cta-main-btn">
            Start Hiring Today — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <p>© 2025 TalentFlow AI · Built by Smart ATS Hiring Suite</p>
          <span className="landing-footer-sep">·</span>
          <Link
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-footer-link"
          >
            API Docs
          </Link>
        </div>
      </footer>

    </div>
  );
}