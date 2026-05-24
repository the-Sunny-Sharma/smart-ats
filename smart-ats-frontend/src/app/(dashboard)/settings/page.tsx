'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/auth.store';
import { User } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import {
  Users, Shield, Crown, UserCheck, Trash2, RefreshCw, Loader2,
  Settings as SettingsIcon, Bell, Lock,
} from 'lucide-react';

const ROLE_CONFIG = {
  admin: { label: 'Admin', icon: Crown, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  recruiter: { label: 'Recruiter', icon: UserCheck, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  hiring_manager: { label: 'Hiring Manager', icon: Shield, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
};

function UserManagement() {
  const qc = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['users-list'],
    queryFn: () => api.get('/auth/users').then((r) => r.data.users),
  });

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      api.patch(`/auth/users/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-list'] }),
  });

  const toggleActive = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      api.patch(`/auth/users/${userId}/status`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users-list'] }),
  });

  const users: User[] = data || [];

  return (
    <div className="card overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" /> Team Members
        </h2>
        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">{users.length} users</span>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-slate-400 text-sm">Loading users…</div>
      ) : (
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-left table-header px-5 py-3">User</th>
              <th className="text-left table-header px-4 py-3">Role</th>
              <th className="text-left table-header px-4 py-3 hidden md:table-cell">Status</th>
              <th className="text-left table-header px-4 py-3 hidden lg:table-cell">Last Login</th>
              <th className="table-header px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => {
              const roleConf = ROLE_CONFIG[u.role];
              const RoleIcon = roleConf.icon;
              const isSelf = u._id === currentUser?._id;

              return (
                <tr key={u._id} className={cn('hover:bg-slate-50/50', !u.isActive && 'opacity-50')}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {u.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{u.name} {isSelf && <span className="text-xs text-slate-400">(you)</span>}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {isSelf ? (
                      <span className={cn('badge border text-xs', roleConf.color)}>
                        <RoleIcon className="w-3 h-3 mr-1" />{roleConf.label}
                      </span>
                    ) : (
                      <select
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ userId: u._id, role: e.target.value })}
                        className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        disabled={updateRole.isPending}
                      >
                        <option value="recruiter">Recruiter</option>
                        <option value="hiring_manager">Hiring Manager</option>
                        <option value="admin">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <span className={cn('badge text-xs', u.isActive ? 'badge-green' : 'badge-red')}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <span className="text-xs text-slate-400">{u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {!isSelf && (
                      <button
                        onClick={() => toggleActive.mutate({ userId: u._id, isActive: !u.isActive })}
                        disabled={toggleActive.isPending}
                        className="text-xs text-slate-400 hover:text-slate-700"
                        title={u.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState(isAdmin ? 'users' : 'profile');

  const tabs = [
    ...(isAdmin ? [{ id: 'users', label: 'User Management', icon: Users }] : []),
    { id: 'profile', label: 'Profile', icon: SettingsIcon },
  ];

  return (
    <div className="max-w-5xl space-y-5">
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage your team and account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors', activeTab === id
              ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100')}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && isAdmin && <UserManagement />}

      {activeTab === 'profile' && (
        <div className="card p-6 max-w-lg">
          <h2 className="font-semibold text-slate-900 mb-4">Your Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-slate-900">{user?.name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <span className={cn('badge border text-xs mt-1', ROLE_CONFIG[user?.role || 'recruiter']?.color)}>
                {ROLE_CONFIG[user?.role || 'recruiter']?.label}
              </span>
            </div>
          </div>
          {!isAdmin && (
            <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-lg">
              <Shield className="w-3.5 h-3.5 inline mr-1" />
              Role changes must be requested from your admin.
            </p>
          )}
        </div>
      )}
    </div>
  );
}