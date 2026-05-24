'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/auth.store';
import { Loader2, Eye, EyeOff, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
        };
      };
    };
  }
}

export default function RegisterPage() {
  const router = useRouter();
  const { register, googleLogin } = useAuthStore();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Handle Google credential response ──────────────────────────────────────
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setGoogleLoading(true);
      try {
        await googleLogin(response.credential);
        toast.success('Account created! Welcome aboard.');
        router.push('/dashboard');
      } catch (err: any) {
        setError(err?.response?.data?.error || 'Google sign-up failed');
      } finally {
        setGoogleLoading(false);
      }
    },
    [googleLogin, router]
  );

  // ── Load Google SDK ────────────────────────────────────────────────────────
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });
      const btn = document.getElementById('google-register-btn');
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
          width: btn.offsetWidth || 352,
          text: 'signup_with',
          shape: 'rectangular',
        });
      }
    };

    if (window.google) {
      initGoogle();
      return;
    }

    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [handleGoogleResponse]);

  // ── Email/password submit ──────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, role: 'recruiter' });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const googleConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">
              TalentFlow <span className="text-indigo-600">AI</span>
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Start hiring smarter today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">

          {/* Google Sign-Up */}
          {googleConfigured && (
            <>
              <div className="relative mb-1">
                <div id="google-register-btn" className="w-full" />
                {googleLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">or register with email</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </>
          )}

          {/* Email/password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input
                type="text"
                className="input"
                placeholder="Jane Smith"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label">Work email</label>
              <input
                type="email"
                className="input"
                placeholder="jane@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Confirm password</label>
              <input
                type="password"
                className="input"
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="btn-primary w-full justify-center py-2.5"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-slate-400 mt-4">
          New accounts are created as <strong>Recruiter</strong>. Admins can change roles in Settings.
        </p>
      </div>
    </div>
  );
}