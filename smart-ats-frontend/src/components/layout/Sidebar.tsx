'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Briefcase, Users, FileText, Calendar,
  BarChart2, Settings, Zap, Sparkles, LogOut, Crown, BookOpen, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth.store';

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/jobs',         label: 'Jobs',         icon: Briefcase },
  { href: '/candidates',   label: 'Candidates',   icon: Users },
  { href: '/applications', label: 'Applications', icon: FileText },
  { href: '/interviews',   label: 'Interviews',   icon: Calendar },
  { href: '/analytics',    label: 'Analytics',    icon: BarChart2 },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ mobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const isPremium = user?.isPremium ?? false;

  const sidebarContent = (
    <aside className="w-60 shrink-0 bg-white border-r border-slate-100 flex flex-col h-full">

      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 leading-none">TalentFlow</p>
            <p className="text-xs text-indigo-600 font-medium leading-none mt-0.5">AI</p>
          </div>
        </div>
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              className={active ? 'sidebar-link-active' : 'sidebar-link-inactive'}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Premium slot */}
      <div className="px-3 pb-2">
        {isPremium ? (
          <div className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium',
            'bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200',
          )}>
            <Crown className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-amber-700 font-semibold text-xs leading-none">Premium</p>
              <p className="text-amber-500 text-xs mt-0.5 leading-none">All AI features unlocked</p>
            </div>
          </div>
        ) : (
          <Link
            href="/premium"
            onClick={onMobileClose}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              pathname === '/premium'
                ? 'bg-indigo-600 text-white'
                : 'bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 border border-indigo-100 hover:from-indigo-100 hover:to-purple-100',
            )}>
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            Upgrade to Premium
          </Link>
        )}
      </div>

      {/* Settings + API Docs + User */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-slate-100 pt-3">
        <Link
          href="/settings"
          onClick={onMobileClose}
          className={pathname === '/settings' ? 'sidebar-link-active' : 'sidebar-link-inactive'}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </Link>

        {/* API Docs — opens in new tab, closes mobile drawer */}
        <Link
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onMobileClose}
          className="sidebar-link-inactive flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
        >
          <BookOpen className="w-4 h-4 shrink-0 text-indigo-400" />
          <span>API Docs</span>
          <span className="ml-auto text-[10px] font-mono bg-indigo-50 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-100 leading-none">
            v1
          </span>
        </Link>

        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg hover:bg-slate-50 group">
            <div className="relative shrink-0">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                {user.name?.[0]?.toUpperCase()}
              </div>
              {isPremium && (
                <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-amber-400 rounded-full flex items-center justify-center">
                  <Crown className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-800 truncate">{user.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user.role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:flex h-full">
        {sidebarContent}
      </div>

      {/* Mobile: drawer overlay */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 lg:hidden"
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 flex lg:hidden">
            {sidebarContent}
          </div>
        </>
      )}
    </>
  );
}