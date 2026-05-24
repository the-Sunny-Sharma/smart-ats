'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/lib/auth.store';
import { Briefcase, Loader2 } from 'lucide-react';

// ── Google Identity Services type shim ───────────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (el: HTMLElement, config: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { login, googleLogin } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── Handle Google credential response ──────────────────────────────────────
  const handleGoogleResponse = useCallback(
    async (response: { credential: string }) => {
      setGoogleLoading(true);
      try {
        await googleLogin(response.credential);
        toast.success('Welcome!');
        router.push('/dashboard');
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Google sign-in failed');
      } finally {
        setGoogleLoading(false);
      }
    },
    [googleLogin, router]
  );

  // ── Load Google Identity Services SDK and render button ───────────────────
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return; // skip if not configured — button stays hidden

    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse,
        auto_select: false,
      });

      const btn = document.getElementById('google-signin-btn');
      if (btn) {
        window.google.accounts.id.renderButton(btn, {
          theme: 'outline',
          size: 'large',
          width: btn.offsetWidth || 352,
          text: 'signin_with',
          shape: 'rectangular',
        });
      }
    };

    // If SDK already loaded (e.g. coming back from register page)
    if (window.google) {
      initGoogle();
      return;
    }

    // Inject script once
    if (!document.getElementById('google-gsi-script')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-script';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initGoogle;
      document.body.appendChild(script);
    } else {
      // Script tag exists but not loaded yet — wait
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
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const googleConfigured = !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-4">
          <Briefcase className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">SmartATS</h1>
        <p className="text-slate-500 text-sm mt-1">Sign in to your account</p>
      </div>

      <div className="card p-8">

        {/* Google Sign-In — only shown when NEXT_PUBLIC_GOOGLE_CLIENT_ID is set */}
        {googleConfigured && (
          <>
            <div className="relative mb-1">
              {/* Google's own button renders here — gives the official look */}
              <div id="google-signin-btn" className="w-full" />

              {/* Overlay spinner while processing after Google callback */}
              {googleLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">or continue with email</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
          </>
        )}

        {/* Email / Password form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary w-full justify-center"
            disabled={loading || googleLoading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-indigo-600 hover:underline font-medium">
            Register
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <p className="text-xs font-medium text-slate-500 mb-2">Demo credentials</p>
          <p className="text-xs text-slate-600">Email: <span className="font-mono">admin@smartats.com</span></p>
          <p className="text-xs text-slate-600">Password: <span className="font-mono">password123</span></p>
        </div>
      </div>
    </div>
  );
}