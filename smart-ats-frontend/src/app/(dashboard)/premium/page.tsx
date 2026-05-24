'use client';

/**
 * /premium/page.tsx
 * ─────────────────
 * Real Cashfree payment flow:
 *  1. User clicks "Pay ₹999"
 *  2. We call our backend POST /api/payments/create-order
 *  3. Backend returns { paymentSessionId, cfEnv }
 *  4. We load the Cashfree JS SDK (lazy, via script tag) and call
 *     cashfree.checkout({ paymentSessionId }) → Cashfree opens its
 *     hosted checkout layer on top of our page
 *  5. On success, Cashfree redirects to /premium?order_id=xxx
 *  6. We detect the query param and call POST /api/payments/verify
 *  7. Backend confirms with Cashfree and marks user isPremium = true
 */

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Check, Loader2, Sparkles, Shield, ArrowLeft, Crown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth.store';

const PREMIUM_FEATURES = [
  'AI Resume Parsing — structured profile extraction',
  'Candidate Fit Score (0–100) with explanation',
  'Skill gap analysis — matched & missing skills',
  'Smart shortlisting suggestions',
  'Keyword & domain extraction',
  'Duplicate candidate detection',
  'Full analytics dashboard',
  'Priority email support',
];

type PayState = 'idle' | 'creating_order' | 'checkout' | 'verifying' | 'success' | 'error';

/** Lazily load the Cashfree JS SDK and return the cashfree instance */
const loadCashfreeSDK = (env: 'sandbox' | 'production'): Promise<any> =>
  new Promise((resolve, reject) => {
    // If already loaded, just instantiate
    if ((window as any).Cashfree) {
      resolve((window as any).Cashfree({ mode: env }));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    script.onload = () => {
      if ((window as any).Cashfree) {
        resolve((window as any).Cashfree({ mode: env }));
      } else {
        reject(new Error('Cashfree SDK failed to initialize'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
    document.head.appendChild(script);
  });

export default function PremiumPage() {
  const searchParams = useSearchParams();
  const [payState, setPayState] = useState<PayState>('idle');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // ── Step 6: detect redirect-back from Cashfree ──────────────────────────
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (!orderId) return;

    const verify = async () => {
      setPayState('verifying');
      try {
        const { data } = await api.post('/payments/verify', { orderId });
        if (data.success) {
          setPayState('success');
          toast.success('Premium activated! 🎉');
        } else {
          setErrorMsg(`Payment status: ${data.status}. If you were charged, contact support.`);
          setPayState('error');
        }
      } catch (err: any) {
        setErrorMsg(err?.response?.data?.error || 'Verification failed. Please contact support.');
        setPayState('error');
      }
    };

    verify();
  }, [searchParams]);

  // ── Step 2–4: create order then open Cashfree checkout ──────────────────
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // Step 2: create order on our backend
    setPayState('creating_order');
    let sessionId: string;
    let cfEnv: 'sandbox' | 'production';

    try {
      const { data } = await api.post('/payments/create-order', { phone: phone || undefined });
      sessionId = data.paymentSessionId;
      cfEnv = data.cfEnv === 'production' ? 'production' : 'sandbox';
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.error || 'Could not initiate payment. Try again.');
      setPayState('error');
      return;
    }

    // Step 3: load SDK + open checkout
    setPayState('checkout');
    try {
      const cashfree = await loadCashfreeSDK(cfEnv);

      // Cashfree Drop checkout — opens a modal/redirect over our page
      const result = await cashfree.checkout({
        paymentSessionId: sessionId,
        // redirectTarget: '_self' means full-page redirect on completion
        // (Cashfree will redirect to the return_url we set on the backend)
        redirectTarget: '_self',
      });

      // If the SDK returns control here (some card flows), check result
      if (result?.error) {
        setErrorMsg(result.error.message || 'Payment failed.');
        setPayState('error');
      }
      // Otherwise Cashfree redirects the page → useEffect above handles it
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment gateway error. Please try again.');
      setPayState('error');
    }
  };

  const isLoading =
    payState === 'creating_order' || payState === 'checkout' || payState === 'verifying';

  const buttonLabel = () => {
    if (payState === 'creating_order') return 'Creating order…';
    if (payState === 'checkout')       return 'Opening checkout…';
    if (payState === 'verifying')      return 'Verifying payment…';
    return 'Pay ₹999 · Upgrade Now';
  };

  // ── Success state ────────────────────────────────────────────────────────
  if (payState === 'success') {
    return (
      <div className="max-w-5xl space-y-6">
        <div className="card p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">You're Premium! 🎉</h2>
          <p className="text-slate-500 mb-6">
            AI features are now fully unlocked. Go hire smarter!
          </p>
          <Link href="/dashboard" className="btn-primary justify-center w-full">
            <Zap className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ── Verifying state (full-page loader after Cashfree redirect) ───────────
  if (payState === 'verifying') {
    return (
      <div className="max-w-5xl flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-slate-600 font-medium">Verifying your payment…</p>
          <p className="text-sm text-slate-400">This will only take a moment.</p>
        </div>
      </div>
    );
  }

  // ── Main page ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="btn-secondary p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="page-title">Upgrade to Premium</h1>
          <p className="text-sm text-slate-500">Unlock the full power of AI-driven hiring</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Plan card ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div
            style={{
              background: 'linear-gradient(135deg, #312e81, #4f46e5)',
              borderRadius: 20,
              padding: '2rem',
              color: '#fff',
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="font-bold text-lg">TalentFlow Premium</span>
            </div>
            <div className="mb-4">
              <span className="text-4xl font-black">₹999</span>
              <span className="text-indigo-300 ml-1">/month</span>
            </div>
            <p className="text-indigo-200 text-sm mb-6">Everything in Free, plus full AI suite</p>
            <div className="space-y-2.5">
              {PREMIUM_FEATURES.map((f) => (
                <div key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-indigo-100">{f}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-sm font-medium text-slate-800">Powered by Cashfree Payments</p>
              <p className="text-xs text-slate-500">256-bit SSL · PCI DSS compliant · Cancel anytime</p>
            </div>
          </div>
        </div>

        {/* ── Payment form ──────────────────────────────────────────────── */}
        <div className="card p-6">
          <h2 className="font-bold text-slate-900 mb-1">Complete Your Purchase</h2>
          <p className="text-sm text-slate-500 mb-5">
            You'll be redirected to Cashfree's secure checkout to complete payment.
          </p>

          <form onSubmit={handlePayment} className="space-y-4">
            {/* Optional phone — Cashfree requires it; prefill makes it smoother */}
            <div>
              <label className="label">
                Mobile Number <span className="text-slate-400 font-normal">(optional — speeds up checkout)</span>
              </label>
              <input
                type="tel"
                className="input"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                maxLength={10}
              />
            </div>

            {/* Order summary */}
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">TalentFlow Premium (1 month)</span>
                <span className="font-medium text-slate-800">₹999</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">GST (18%)</span>
                <span className="font-medium text-slate-800">Included</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold">
                <span className="text-slate-800">Total</span>
                <span className="text-indigo-700">₹999</span>
              </div>
            </div>

            {payState === 'error' && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full justify-center py-3 text-base font-bold"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> {buttonLabel()}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" /> Pay ₹999 · Upgrade Now
                </>
              )}
            </button>

            <p className="text-center text-xs text-slate-400">
              You'll be taken to Cashfree's secure hosted checkout.
              Your card details are never stored on our servers.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}