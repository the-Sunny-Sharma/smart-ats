'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Search, Check, CheckCheck, Trash2, X, Loader2, Menu } from 'lucide-react';
import { useAuthStore } from '@/lib/auth.store';
import api from '@/lib/api';
import { cn, formatDate } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

// ─── Icon map per notification type ──────────────────────────────────────────

const TYPE_STYLES: Record<string, { dot: string }> = {
  new_application:     { dot: 'bg-blue-500' },
  stage_changed:       { dot: 'bg-amber-500' },
  interview_scheduled: { dot: 'bg-purple-500' },
  interview_reminder:  { dot: 'bg-orange-500' },
  shortlisted:         { dot: 'bg-emerald-500' },
  offer_sent:          { dot: 'bg-indigo-500' },
  candidate_hired:     { dot: 'bg-green-600' },
  job_posted:          { dot: 'bg-sky-500' },
  ai_score_ready:      { dot: 'bg-violet-500' },
};

// ─── Page title map ───────────────────────────────────────────────────────────

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':    'Dashboard',
  '/jobs':         'Jobs',
  '/candidates':   'Candidates',
  '/applications': 'Applications',
  '/interviews':   'Interviews',
  '/analytics':    'Analytics',
  '/settings':     'Settings',
  '/premium':      'Premium',
};

const POLL_INTERVAL = 30_000;

// ─── Notification Bell + Dropdown ────────────────────────────────────────────

function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=20');
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // silently fail
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    pollRef.current = setInterval(() => fetchNotifications(true), POLL_INTERVAL);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchNotifications]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen((prev) => {
      if (!prev) fetchNotifications(false);
      return !prev;
    });
  };

  const markRead = async (id: string) => {
    setActionLoading(id);
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ } finally { setActionLoading(null); }
  };

  const markAllRead = async () => {
    setActionLoading('all');
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ } finally { setActionLoading(null); }
  };

  const remove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(`del-${id}`);
    try {
      await api.delete(`/notifications/${id}`);
      const removed = notifications.find((n) => n._id === id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (removed && !removed.read) setUnreadCount((c) => Math.max(0, c - 1));
    } catch { /* ignore */ } finally { setActionLoading(null); }
  };

  const handleRowClick = async (n: Notification) => {
    if (!n.read) await markRead(n._id);
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const dotStyle = (type: string) => TYPE_STYLES[type]?.dot ?? 'bg-slate-400';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          open ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
        )}
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} disabled={actionLoading === 'all'} title="Mark all as read"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                  {actionLoading === 'all' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading…
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} onClick={() => handleRowClick(n)}
                  className={cn('group flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 last:border-0 transition-colors',
                    n.read ? 'hover:bg-slate-50' : 'bg-indigo-50/40 hover:bg-indigo-50/70')}>
                  <div className="mt-1.5 shrink-0">
                    <span className={cn('block w-2 h-2 rounded-full', dotStyle(n.type))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm leading-snug truncate', n.read ? 'text-slate-600 font-normal' : 'text-slate-800 font-medium')}>
                      {n.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                    <p className="text-[11px] text-slate-300 mt-1">{formatDate(n.createdAt)}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!n.read && (
                      <button onClick={(e) => { e.stopPropagation(); markRead(n._id); }} disabled={actionLoading === n._id}
                        title="Mark as read" className="p-1 rounded text-slate-300 hover:text-indigo-500 hover:bg-indigo-50">
                        {actionLoading === n._id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      </button>
                    )}
                    <button onClick={(e) => remove(n._id, e)} disabled={actionLoading === `del-${n._id}`}
                      title="Delete" className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50">
                      {actionLoading === `del-${n._id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-400">
                Showing latest {notifications.length} notifications · auto-refreshes every 30s
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);

  const title =
    Object.entries(PAGE_TITLES).find(
      ([path]) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path))
    )?.[1] || 'SmartATS';

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 shrink-0">
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-base font-semibold text-slate-800">{title}</h2>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Global search hint — hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-400 text-sm cursor-pointer hover:bg-slate-200 transition-colors">
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline ml-2 text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">⌘K</kbd>
        </div>

        <NotificationBell />

        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>
    </header>
  );
}
// 'use client';

// import { useState, useEffect, useRef, useCallback } from 'react';
// import { usePathname, useRouter } from 'next/navigation';
// import { Bell, Search, Check, CheckCheck, Trash2, X, Loader2 } from 'lucide-react';
// import { useAuthStore } from '@/lib/auth.store';
// import api from '@/lib/api';
// import { cn, formatDate } from '@/lib/utils';

// // ─── Types ────────────────────────────────────────────────────────────────────

// interface Notification {
//   _id: string;
//   type: string;
//   title: string;
//   message: string;
//   read: boolean;
//   link?: string;
//   createdAt: string;
// }

// // ─── Icon map per notification type ──────────────────────────────────────────

// const TYPE_STYLES: Record<string, { dot: string }> = {
//   new_application:    { dot: 'bg-blue-500' },
//   stage_changed:      { dot: 'bg-amber-500' },
//   interview_scheduled:{ dot: 'bg-purple-500' },
//   interview_reminder: { dot: 'bg-orange-500' },
//   shortlisted:        { dot: 'bg-emerald-500' },
//   offer_sent:         { dot: 'bg-indigo-500' },
//   candidate_hired:    { dot: 'bg-green-600' },
//   job_posted:         { dot: 'bg-sky-500' },
//   ai_score_ready:     { dot: 'bg-violet-500' },
// };

// // ─── Page title map ───────────────────────────────────────────────────────────

// const PAGE_TITLES: Record<string, string> = {
//   '/dashboard':    'Dashboard',
//   '/jobs':         'Jobs',
//   '/candidates':   'Candidates',
//   '/applications': 'Applications',
//   '/interviews':   'Interviews',
//   '/analytics':    'Analytics',
//   '/settings':     'Settings',
//   '/premium':      'Premium',
// };

// const POLL_INTERVAL = 30_000; // 30 seconds

// // ─── Notification Bell + Dropdown ────────────────────────────────────────────

// function NotificationBell() {
//   const router = useRouter();
//   const [open, setOpen] = useState(false);
//   const [notifications, setNotifications] = useState<Notification[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const [loading, setLoading] = useState(false);
//   const [actionLoading, setActionLoading] = useState<string | null>(null);
//   const dropdownRef = useRef<HTMLDivElement>(null);
//   const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   // ── Fetch notifications (used for polling + on-open) ──────────────────────
//   const fetchNotifications = useCallback(async (silent = false) => {
//     if (!silent) setLoading(true);
//     try {
//       const { data } = await api.get('/notifications?limit=20');
//       setNotifications(data.notifications);
//       setUnreadCount(data.unreadCount);
//     } catch {
//       // silently fail — polling should not disrupt UI
//     } finally {
//       if (!silent) setLoading(false);
//     }
//   }, []);

//   // ── Poll every 30s for unread badge count ─────────────────────────────────
//   useEffect(() => {
//     // initial silent fetch for badge
//     fetchNotifications(true);

//     pollRef.current = setInterval(() => {
//       fetchNotifications(true);
//     }, POLL_INTERVAL);

//     return () => {
//       if (pollRef.current) clearInterval(pollRef.current);
//     };
//   }, [fetchNotifications]);

//   // ── Close dropdown on outside click ───────────────────────────────────────
//   useEffect(() => {
//     const handler = (e: MouseEvent) => {
//       if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
//         setOpen(false);
//       }
//     };
//     document.addEventListener('mousedown', handler);
//     return () => document.removeEventListener('mousedown', handler);
//   }, []);

//   // ── Open dropdown ─────────────────────────────────────────────────────────
//   const handleOpen = () => {
//     setOpen((prev) => {
//       if (!prev) fetchNotifications(false); // fresh load when opening
//       return !prev;
//     });
//   };

//   // ── Mark single read ──────────────────────────────────────────────────────
//   const markRead = async (id: string) => {
//     setActionLoading(id);
//     try {
//       await api.patch(`/notifications/${id}/read`);
//       setNotifications((prev) =>
//         prev.map((n) => (n._id === id ? { ...n, read: true } : n))
//       );
//       setUnreadCount((c) => Math.max(0, c - 1));
//     } catch { /* ignore */ } finally {
//       setActionLoading(null);
//     }
//   };

//   // ── Mark all read ─────────────────────────────────────────────────────────
//   const markAllRead = async () => {
//     setActionLoading('all');
//     try {
//       await api.patch('/notifications/read-all');
//       setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
//       setUnreadCount(0);
//     } catch { /* ignore */ } finally {
//       setActionLoading(null);
//     }
//   };

//   // ── Delete single ─────────────────────────────────────────────────────────
//   const remove = async (id: string, e: React.MouseEvent) => {
//     e.stopPropagation();
//     setActionLoading(`del-${id}`);
//     try {
//       await api.delete(`/notifications/${id}`);
//       const removed = notifications.find((n) => n._id === id);
//       setNotifications((prev) => prev.filter((n) => n._id !== id));
//       if (removed && !removed.read) setUnreadCount((c) => Math.max(0, c - 1));
//     } catch { /* ignore */ } finally {
//       setActionLoading(null);
//     }
//   };

//   // ── Click notification row ─────────────────────────────────────────────────
//   const handleRowClick = async (n: Notification) => {
//     if (!n.read) await markRead(n._id);
//     setOpen(false);
//     if (n.link) router.push(n.link);
//   };

//   const dotStyle = (type: string) =>
//     TYPE_STYLES[type]?.dot ?? 'bg-slate-400';

//   return (
//     <div className="relative" ref={dropdownRef}>
//       {/* Bell button */}
//       <button
//         onClick={handleOpen}
//         className={cn(
//           'relative p-2 rounded-lg transition-colors',
//           open
//             ? 'text-indigo-600 bg-indigo-50'
//             : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100',
//         )}
//         aria-label="Notifications"
//       >
//         <Bell className="w-4 h-4" />
//         {unreadCount > 0 && (
//           <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
//             {unreadCount > 99 ? '99+' : unreadCount}
//           </span>
//         )}
//       </button>

//       {/* Dropdown */}
//       {open && (
//         <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg shadow-slate-200/60 z-50 overflow-hidden">

//           {/* Header */}
//           <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
//             <div className="flex items-center gap-2">
//               <span className="text-sm font-semibold text-slate-800">Notifications</span>
//               {unreadCount > 0 && (
//                 <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">
//                   {unreadCount} new
//                 </span>
//               )}
//             </div>
//             <div className="flex items-center gap-1">
//               {unreadCount > 0 && (
//                 <button
//                   onClick={markAllRead}
//                   disabled={actionLoading === 'all'}
//                   title="Mark all as read"
//                   className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
//                 >
//                   {actionLoading === 'all'
//                     ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
//                     : <CheckCheck className="w-3.5 h-3.5" />
//                   }
//                 </button>
//               )}
//               <button
//                 onClick={() => setOpen(false)}
//                 className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
//               >
//                 <X className="w-3.5 h-3.5" />
//               </button>
//             </div>
//           </div>

//           {/* List */}
//           <div className="max-h-[360px] overflow-y-auto">
//             {loading ? (
//               <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-sm">
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Loading…
//               </div>
//             ) : notifications.length === 0 ? (
//               <div className="py-10 text-center">
//                 <Bell className="w-8 h-8 text-slate-200 mx-auto mb-2" />
//                 <p className="text-sm text-slate-400">No notifications yet</p>
//               </div>
//             ) : (
//               notifications.map((n) => (
//                 <div
//                   key={n._id}
//                   onClick={() => handleRowClick(n)}
//                   className={cn(
//                     'group flex items-start gap-3 px-4 py-3 cursor-pointer border-b border-slate-50 last:border-0 transition-colors',
//                     n.read
//                       ? 'hover:bg-slate-50'
//                       : 'bg-indigo-50/40 hover:bg-indigo-50/70',
//                   )}
//                 >
//                   {/* Colour dot */}
//                   <div className="mt-1.5 shrink-0">
//                     <span className={cn('block w-2 h-2 rounded-full', dotStyle(n.type))} />
//                   </div>

//                   {/* Content */}
//                   <div className="flex-1 min-w-0">
//                     <p className={cn(
//                       'text-sm leading-snug truncate',
//                       n.read ? 'text-slate-600 font-normal' : 'text-slate-800 font-medium',
//                     )}>
//                       {n.title}
//                     </p>
//                     <p className="text-xs text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
//                       {n.message}
//                     </p>
//                     <p className="text-[11px] text-slate-300 mt-1">
//                       {formatDate(n.createdAt)}
//                     </p>
//                   </div>

//                   {/* Actions — visible on hover */}
//                   <div className="shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
//                     {!n.read && (
//                       <button
//                         onClick={(e) => { e.stopPropagation(); markRead(n._id); }}
//                         disabled={actionLoading === n._id}
//                         title="Mark as read"
//                         className="p-1 rounded text-slate-300 hover:text-indigo-500 hover:bg-indigo-50"
//                       >
//                         {actionLoading === n._id
//                           ? <Loader2 className="w-3 h-3 animate-spin" />
//                           : <Check className="w-3 h-3" />
//                         }
//                       </button>
//                     )}
//                     <button
//                       onClick={(e) => remove(n._id, e)}
//                       disabled={actionLoading === `del-${n._id}`}
//                       title="Delete"
//                       className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50"
//                     >
//                       {actionLoading === `del-${n._id}`
//                         ? <Loader2 className="w-3 h-3 animate-spin" />
//                         : <Trash2 className="w-3 h-3" />
//                       }
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>

//           {/* Footer */}
//           {notifications.length > 0 && (
//             <div className="px-4 py-2.5 border-t border-slate-100 text-center">
//               <p className="text-xs text-slate-400">
//                 Showing latest {notifications.length} notifications · auto-refreshes every 30s
//               </p>
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Header ───────────────────────────────────────────────────────────────────

// export default function Header() {
//   const pathname = usePathname();
//   const user = useAuthStore((s) => s.user);

//   const title =
//     Object.entries(PAGE_TITLES).find(
//       ([path]) => pathname === path || (path !== '/dashboard' && pathname.startsWith(path))
//     )?.[1] || 'SmartATS';

//   return (
//     <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
//       <h2 className="text-base font-semibold text-slate-800">{title}</h2>

//       <div className="flex items-center gap-3">
//         {/* Global search hint */}
//         <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg text-slate-400 text-sm cursor-pointer hover:bg-slate-200 transition-colors">
//           <Search className="w-3.5 h-3.5" />
//           <span>Search...</span>
//           <kbd className="ml-2 text-xs bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono">
//             ⌘K
//           </kbd>
//         </div>

//         {/* Live notification bell */}
//         <NotificationBell />

//         {/* Avatar */}
//         <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm">
//           {user?.name?.[0]?.toUpperCase() || 'U'}
//         </div>
//       </div>
//     </header>
//   );
// }