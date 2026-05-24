'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';
import api from '@/lib/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'recruiter' | 'hiring_manager';
  avatar?: string;
  isPremium?: boolean;
  premiumSince?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; role?: string }) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  refreshPremium: () => Promise<void>;
}

function decodeGoogleJwt(token: string): { name: string; email: string; picture: string; sub: string } {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const json = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join('')
  );
  return JSON.parse(json);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/login', { email, password });
          const { token, user } = res.data;
          Cookies.set('token', token, { expires: 7 });
          localStorage.setItem('token', token);
          set({ token, user, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res = await api.post('/auth/register', data);
          const { token, user } = res.data;
          Cookies.set('token', token, { expires: 7 });
          localStorage.setItem('token', token);
          set({ token, user, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      googleLogin: async (credential: string) => {
        set({ isLoading: true });
        try {
          const { name, email, picture, sub } = decodeGoogleJwt(credential);
          const res = await api.post('/auth/google', { name, email, image: picture, googleId: sub });
          const { token, user } = res.data;
          Cookies.set('token', token, { expires: 7 });
          localStorage.setItem('token', token);
          set({ token, user, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        Cookies.remove('token');
        localStorage.removeItem('token');
        set({ user: null, token: null });
        window.location.href = '/login';
      },

      fetchMe: async () => {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data.user });
        } catch {
          get().logout();
        }
      },

      /** Call after payment verify to refresh isPremium in the store */
      refreshPremium: async () => {
        try {
          const res = await api.get('/payments/status');
          set((state) => ({
            user: state.user ? { ...state.user, isPremium: res.data.isPremium } : state.user,
          }));
        } catch {
          // non-critical
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);