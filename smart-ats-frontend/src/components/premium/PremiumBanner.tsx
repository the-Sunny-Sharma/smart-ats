'use client';

import { useState } from 'react';
import { X, Zap, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PremiumBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #7c3aed 100%)',
      borderRadius: 14, padding: '1rem 1.25rem', marginBottom: '1.5rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '1rem', position: 'relative', overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(79,70,229,0.4)',
    }}>
      {/* Background shimmer */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        <div style={{
          background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '0.6rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Zap className="w-5 h-5 text-yellow-300" fill="currentColor" />
        </div>
        <div>
          <p style={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem', margin: 0 }}>
            🚀 Unlock AI-Powered Hiring
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem', margin: '0.1rem 0 0' }}>
            Resume parsing, fit scoring, smart shortlisting — upgrade to Premium for ₹999/mo
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        <Link href="/premium" style={{
          background: '#fff', color: '#4f46e5', padding: '0.5rem 1.25rem',
          borderRadius: 8, fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '0.4rem',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <Sparkles className="w-3.5 h-3.5" /> Upgrade Now
        </Link>
        <button onClick={() => setDismissed(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', color: 'rgba(255,255,255,0.6)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}