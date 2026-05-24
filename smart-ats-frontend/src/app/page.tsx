// import { redirect } from 'next/navigation';

// export default function RootPage() {
//   // Server component: redirect to landing page
//   // The dashboard is protected by middleware
//   redirect('/');
// }
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TalentFlow AI — Hire Smarter with AI',
  description: 'AI-Powered Hiring. Smarter Decisions. Better Teams. Transform your recruitment process with TalentFlow AI.',
};

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: '#080d1a', color: '#e2e8f0', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', background: 'rgba(8,13,26,0.8)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>TalentFlow <span style={{ color: '#818cf8' }}>AI</span></span>
          </div>

          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#94a3b8' }}>
            <a href="#features" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-white">Features</a>
            <a href="#pricing" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-white">Pricing</a>
            <a href="#comparison" style={{ color: 'inherit', textDecoration: 'none' }} className="hover:text-white">Compare</a>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link href="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '0.875rem' }}>Sign in</Link>
            <Link href="/register" style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', padding: '0.5rem 1.25rem', borderRadius: 8,
              textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600,
              boxShadow: '0 0 24px rgba(99,102,241,0.4)',
            }}>
              Start Hiring Today
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '7rem 2rem 5rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* Background glow */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 800, height: 500, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 999, padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '2rem' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6ee7b7', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            Limited Early Access Available
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: '1.5rem' }}>
            Hire Smarter<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              with AI
            </span>
          </h1>

          <p style={{ fontSize: '1.25rem', color: '#94a3b8', marginBottom: '1rem', lineHeight: 1.6 }}>
            Transform Your Recruitment Process
          </p>
          <p style={{ fontSize: '1rem', color: '#64748b', marginBottom: '2.5rem', lineHeight: 1.7 }}>
            AI-Powered Hiring. Smarter Decisions. Better Teams.<br />
            Find the Best Talent Faster with semantic matching, explainable AI scoring, and automated workflows.
          </p>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff', padding: '0.875rem 2rem', borderRadius: 12,
              textDecoration: 'none', fontWeight: 700, fontSize: '1rem',
              boxShadow: '0 0 32px rgba(99,102,241,0.5), 0 4px 16px rgba(0,0,0,0.3)',
            }}>
              Start Hiring Today →
            </Link>
            <Link href="/login" style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)',
              color: '#e2e8f0', padding: '0.875rem 2rem', borderRadius: 12,
              textDecoration: 'none', fontWeight: 600, fontSize: '1rem',
            }}>
              View Demo
            </Link>
          </div>

          <p style={{ fontSize: '0.75rem', color: '#475569', marginTop: '1.5rem' }}>
            No credit card required · Free tier available · Setup in 5 minutes
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '2rem', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2rem', textAlign: 'center' }}>
          {[
            { num: '10x', label: 'Faster screening' },
            { num: '94%', label: 'Match accuracy' },
            { num: '3hrs', label: 'Saved per hire' },
            { num: '500+', label: 'Teams onboarded' },
          ].map(({ num, label }) => (
            <div key={num}>
              <p style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{num}</p>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section id="features" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
              Everything you need to hire smarter
            </h2>
            <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
              Premium gives your team AI superpowers — free tier gives you the foundation.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {[
              {
                icon: '🧠', title: 'AI Resume Parsing',
                desc: 'Automatically extract skills, experience, education, and contact info from any resume in seconds.',
                premium: true,
              },
              {
                icon: '🎯', title: 'Semantic Candidate Scoring',
                desc: '0–100 fit score with explainable breakdown — skill match, experience match, education match.',
                premium: true,
              },
              {
                icon: '⚡', title: 'Smart Shortlisting',
                desc: 'AI recommends the top candidates for each role so you focus your time where it matters.',
                premium: true,
              },
              {
                icon: '📋', title: 'Job Pipeline Kanban',
                desc: 'Visual drag-and-drop pipeline from application to hire. Full stage history tracking.',
                premium: false,
              },
              {
                icon: '📅', title: 'Interview Scheduling',
                desc: 'One-click scheduling with automated email notifications to candidates and interviewers.',
                premium: false,
              },
              {
                icon: '📊', title: 'Recruitment Analytics',
                desc: 'Full-funnel metrics, time-to-hire, pipeline conversion rates, and hiring trends.',
                premium: false,
              },
            ].map(({ icon, title, desc, premium }) => (
              <div key={title} style={{
                background: 'rgba(255,255,255,0.03)', border: `1px solid ${premium ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 16, padding: '1.75rem', position: 'relative', overflow: 'hidden',
              }}>
                {premium && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 999, letterSpacing: '0.05em' }}>
                    PREMIUM
                  </div>
                )}
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>{icon}</div>
                <h3 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Free vs Premium comparison */}
      <section id="comparison" style={{ padding: '4rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '3rem', letterSpacing: '-0.02em' }}>
            Free vs Premium
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 0, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 600, fontSize: '0.875rem', color: '#64748b' }}>Feature</div>
            <div style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)', fontWeight: 700 }}>Free</div>
            <div style={{ padding: '1.25rem', textAlign: 'center', background: 'rgba(99,102,241,0.15)', borderBottom: '1px solid rgba(99,102,241,0.3)', fontWeight: 700, color: '#a5b4fc' }}>Premium ✨</div>

            {[
              ['Job postings', '✅', '✅'],
              ['Candidate management', '✅', '✅'],
              ['Pipeline tracking', '✅', '✅'],
              ['Interview scheduling', '✅', '✅'],
              ['Basic analytics', '✅', '✅'],
              ['AI resume parsing', '❌', '✅'],
              ['AI fit scoring (0–100)', '❌', '✅'],
              ['Explainable recommendations', '❌', '✅'],
              ['Smart shortlisting', '❌', '✅'],
              ['Keyword extraction', '❌', '✅'],
              ['Duplicate detection', '❌', '✅'],
              ['Full analytics + trends', '❌', '✅'],
            ].map(([feature, free, premium], i) => (
              <>
                <div key={`f${i}`} style={{ padding: '0.875rem 1.5rem', fontSize: '0.875rem', color: '#94a3b8', borderBottom: i < 11 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>{feature}</div>
                <div key={`fr${i}`} style={{ padding: '0.875rem', textAlign: 'center', fontSize: '1rem', borderBottom: i < 11 ? '1px solid rgba(255,255,255,0.05)' : 'none', background: i % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>{free}</div>
                <div key={`pr${i}`} style={{ padding: '0.875rem', textAlign: 'center', fontSize: '1rem', borderBottom: i < 11 ? '1px solid rgba(99,102,241,0.2)' : 'none', background: i % 2 === 0 ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' }}>{premium}</div>
              </>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '6rem 2rem' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>Simple, transparent pricing</h2>
            <p style={{ color: '#64748b' }}>Start free, upgrade when you're ready</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', maxWidth: 700, margin: '0 auto' }}>
            {/* Free */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '2.5rem' }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Free</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>₹0<span style={{ fontSize: '1rem', fontWeight: 400, color: '#64748b' }}>/mo</span></div>
              <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: '2rem' }}>Manual ATS forever</p>
              <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, color: '#e2e8f0', textDecoration: 'none', fontWeight: 600 }}>
                Get started free
              </Link>
            </div>

            {/* Premium */}
            <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))', border: '1px solid rgba(99,102,241,0.5)', borderRadius: 20, padding: '2.5rem', position: 'relative', boxShadow: '0 0 48px rgba(99,102,241,0.2)' }}>
              <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.3rem 1rem', borderRadius: 999, letterSpacing: '0.1em' }}>
                MOST POPULAR
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '1.2rem', marginBottom: '0.5rem' }}>Premium</h3>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
                ₹999<span style={{ fontSize: '1rem', fontWeight: 400, color: '#94a3b8' }}>/mo</span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>Full AI-powered hiring suite</p>
              <PremiumCheckoutButton />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 700, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 999, padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#a5b4fc', marginBottom: '2rem' }}>
            🔥 Limited Early Access Available
          </div>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: '1rem' }}>
            Ready to find the best<br />talent faster?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '1.1rem' }}>
            Join hundreds of teams already hiring smarter with AI-Powered Hiring. Smarter Decisions. Better Teams.
          </p>
          <Link href="/register" style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: '#fff', padding: '1rem 2.5rem', borderRadius: 12,
            textDecoration: 'none', fontWeight: 700, fontSize: '1.1rem',
            boxShadow: '0 0 40px rgba(99,102,241,0.5)',
          }}>
            Start Hiring Today — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '2rem', textAlign: 'center', color: '#475569', fontSize: '0.8rem' }}>
        <p>© 2025 TalentFlow AI · Built by Smart ATS Hiring Suite</p>
      </footer>

     
    </div>
  );
}

// Cashfree payment button — client component
function PremiumCheckoutButton() {
  'use client';
  return (
    <Link href="/register?plan=premium" style={{
      display: 'block', textAlign: 'center', padding: '0.75rem',
      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
      borderRadius: 10, color: '#fff', textDecoration: 'none', fontWeight: 700,
      boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
    }}>
      Upgrade to Premium →
    </Link>
  );
}