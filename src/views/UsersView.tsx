import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  Plus,
  Key,
  CheckCircle2,
  XCircle,
  ShieldAlert,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { UserProfile, UserRole } from '../types';

export const UsersView: React.FC = () => {
  const { users, currentUser, switchUser } = useArchive();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Supervisor');

  const permissionsMatrix: { feature: string; manager: boolean; supervisor: boolean; user: boolean }[] = [
    { feature: 'View Dashboard & Volume KPIs', manager: true, supervisor: true, user: true },
    { feature: 'Search & Inspect Archive Projects', manager: true, supervisor: true, user: true },
    { feature: 'Update Project Archive Status', manager: true, supervisor: true, user: false },
    { feature: 'Handover & Deliver Projects', manager: true, supervisor: true, user: false },
    { feature: 'Close Archive Box (Standard)', manager: true, supervisor: true, user: false },
    { feature: 'Override Box Closure with Incomplete Records', manager: true, supervisor: false, user: false },
    { feature: 'Reopen Closed Box', manager: true, supervisor: false, user: false },
    { feature: 'Upload & Commit Operational Excel Workbooks', manager: true, supervisor: true, user: false },
    { feature: 'Generate & Print Zebra 100x50mm Thermal Labels', manager: true, supervisor: true, user: true },
    { feature: 'Access Central System Audit Trail', manager: true, supervisor: true, user: false },
    { feature: 'Configure Box Allocation Ranges (Settings)', manager: true, supervisor: false, user: false },
    { feature: 'Manage System Users & Roles', manager: true, supervisor: false, user: false },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#007AFF]" />
            <span>Users & Role-Based Access Control (RBAC)</span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
            Manage system operators, assign boxes, and enforce security policies across System Manager, Supervisor, and User tiers
          </p>
        </div>
      </div>

      {/* Active User Switcher & Info Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 to-indigo-50/70 dark:from-neutral-900/80 dark:to-neutral-800/80 border border-blue-200/60 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#007AFF] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            {currentUser.full_name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {currentUser.full_name}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#007AFF] text-white">
                {currentUser.role}
              </span>
            </div>
            <div className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
              Logged in as <code className="font-mono">{currentUser.username}</code> · Assigned Boxes: {currentUser.assigned_boxes.join(', ')}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-neutral-500">Switch Active Test Persona:</span>
          <select
            value={currentUser.username}
            onChange={e => switchUser(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold cursor-pointer shadow-xs focus:outline-none"
          >
            {users.map(u => (
              <option key={u.username} value={u.username}>
                {u.full_name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#18181B] shadow-xs">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
            Authorized Operational Personnel
          </h3>
          <span className="text-xs text-neutral-400">{users.length} active operators</span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-neutral-50 dark:bg-neutral-900/90 text-[#86868B] dark:text-[#98989D] border-b border-neutral-200 dark:border-neutral-800 font-semibold">
            <tr>
              <th className="py-2.5 px-3">Username</th>
              <th className="py-2.5 px-3">Full Name</th>
              <th className="py-2.5 px-3">Role</th>
              <th className="py-2.5 px-3">Assigned Boxes</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Last Login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <td className="py-2.5 px-3 font-mono font-bold text-[#007AFF]">
                  {u.username}
                </td>
                <td className="py-2.5 px-3 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {u.full_name}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      u.role === 'System Manager'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                        : u.role === 'Supervisor'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {u.role}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono text-neutral-500">
                  {u.assigned_boxes.join(', ')}
                </td>
                <td className="py-2.5 px-3">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{u.status}</span>
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono text-neutral-400">
                  {u.last_login}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Permissions Matrix */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#18181B] shadow-xs">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#007AFF]" />
              <span>Role Permissions Matrix</span>
            </h3>
            <p className="text-xs text-[#86868B] dark:text-[#98989D]">
              Enforced across UI navigation, status updates, overrides, and backend operations
            </p>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-neutral-50 dark:bg-neutral-900/90 text-[#86868B] dark:text-[#98989D] border-b border-neutral-200 dark:border-neutral-800 font-semibold">
            <tr>
              <th className="py-2.5 px-4">System Operation / Capability</th>
              <th className="py-2.5 px-4 text-center">System Manager</th>
              <th className="py-2.5 px-4 text-center">Supervisor</th>
              <th className="py-2.5 px-4 text-center">Standard User</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {permissionsMatrix.map((item, idx) => (
              <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                <td className="py-2.5 px-4 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {item.feature}
                </td>
                <td className="py-2.5 px-4 text-center">
                  {item.manager ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                  )}
                </td>
                <td className="py-2.5 px-4 text-center">
                  {item.supervisor ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                  )}
                </td>
                <td className="py-2.5 px-4 text-center">
                  {item.user ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" />
                  ) : (
                    <XCircle className="w-4 h-4 text-neutral-300 dark:text-neutral-700 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
