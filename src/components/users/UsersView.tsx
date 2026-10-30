import React, { useState } from 'react';
import {
  Check,
  CheckCircle2,
  Lock,
  Plus,
  Shield,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users as UsersIcon,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { storage } from '../../utils/storage';

export const UsersView: React.FC = () => {
  const { users, currentUser, switchUser } = useApp();

  const [activeUsersList, setActiveUsersList] = useState<User[]>(users);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('all');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  // New user form state
  const [newFullName, setNewFullName] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Supervisor');
  const [newBoxes, setNewBoxes] = useState('D41, D42');

  const filteredUsers = activeUsersList.filter((u) => {
    return selectedRoleFilter === 'all' || u.role === selectedRoleFilter;
  });

  const handleRoleChange = (userId: string, newR: UserRole) => {
    const updated = activeUsersList.map((u) => (u.id === userId ? { ...u, role: newR } : u));
    setActiveUsersList(updated);
    storage.setUsers(updated);

    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'USER_ROLE_CHANGED',
      entity_type: 'user',
      entity_id: userId,
      details: `Role updated to ${newR} for user #${userId}.`,
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName || !newUserName) return;

    const newUser: User = {
      id: `user-${Date.now()}`,
      full_name: newFullName,
      user_name: newUserName.toLowerCase().trim(),
      role: newRole,
      status: 'Active',
      last_login: new Date().toISOString(),
      assigned_boxes: newBoxes.split(',').map((b) => b.trim()).filter(Boolean),
      assigned_dossiers: [],
    };

    const updated = [...activeUsersList, newUser];
    setActiveUsersList(updated);
    storage.setUsers(updated);

    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'USER_ROLE_CHANGED',
      entity_type: 'user',
      entity_id: newUser.id,
      details: `Created new user account '${newUser.full_name}' (@${newUser.user_name}) with role '${newUser.role}'.`,
    });

    setIsAddUserModalOpen(false);
    setNewFullName('');
    setNewUserName('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-[#007AFF]" />
            <span>Users & Role-Based Permissions (RBAC)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage operational archivists, supervisors, box assignments, and permission matrices (§10).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User Account</span>
          </button>
        </div>
      </div>

      {/* Permissions Matrix Overview Card */}
      <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#007AFF]" />
          <span>Configured Role Permissions Matrix</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase">
                <th className="py-2.5 px-4">Role</th>
                <th className="py-2.5 px-4">Data Import</th>
                <th className="py-2.5 px-4">Box Closure</th>
                <th className="py-2.5 px-4">Override Blockers</th>
                <th className="py-2.5 px-4">Reopen Box</th>
                <th className="py-2.5 px-4">Project Delivery</th>
                <th className="py-2.5 px-4">Labels</th>
                <th className="py-2.5 px-4">Audit Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-[11px]">
              <tr>
                <td className="py-2.5 px-4 font-bold text-[#007AFF] font-sans">System Manager</td>
                <td className="py-2.5 px-4 text-[#34C759] font-bold">Full</td>
                <td className="py-2.5 px-4 text-[#34C759] font-bold">Standard</td>
                <td className="py-2.5 px-4 text-[#34C759] font-bold">Authorized</td>
                <td className="py-2.5 px-4 text-[#34C759] font-bold">Authorized</td>
                <td className="py-2.5 px-4 text-[#34C759] font-bold">Allowed</td>
                <td className="py-2.5 px-4 text-[#34C759] font-bold">Allowed</td>
                <td className="py-2.5 px-4 text-[#34C759] font-bold">Full Access</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-indigo-600 font-sans">Supervisor</td>
                <td className="py-2.5 px-4 text-[#34C759]">Upload</td>
                <td className="py-2.5 px-4 text-[#34C759]">Standard</td>
                <td className="py-2.5 px-4 text-slate-400">Blocked</td>
                <td className="py-2.5 px-4 text-slate-400">Blocked</td>
                <td className="py-2.5 px-4 text-[#34C759] font-bold">Allowed</td>
                <td className="py-2.5 px-4 text-[#34C759]">Allowed</td>
                <td className="py-2.5 px-4 text-slate-600">Reports Only</td>
              </tr>
              <tr>
                <td className="py-2.5 px-4 font-bold text-slate-600 font-sans">User (Archivist)</td>
                <td className="py-2.5 px-4 text-slate-400">View Only</td>
                <td className="py-2.5 px-4 text-slate-400">Blocked</td>
                <td className="py-2.5 px-4 text-slate-400">Blocked</td>
                <td className="py-2.5 px-4 text-slate-400">Blocked</td>
                <td className="py-2.5 px-4 text-slate-400">Blocked</td>
                <td className="py-2.5 px-4 text-[#34C759]">Generate</td>
                <td className="py-2.5 px-4 text-slate-400">Restricted</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Assigned Boxes</th>
                <th className="py-3 px-4 text-right">Switch Active Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredUsers.map((u) => {
                const isCurrent = u.id === currentUser.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-xs">
                          {u.full_name[0]}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {u.full_name}
                          </span>
                          {isCurrent && (
                            <span className="text-[10px] text-[#007AFF] font-bold">
                              (Currently Active Session)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      @{u.user_name}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="System Manager">System Manager</option>
                        <option value="Supervisor">Supervisor</option>
                        <option value="User">User</option>
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#34C759]/10 text-[#34C759]">
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(u.last_login).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.assigned_boxes.join(', ') || 'All Boxes'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isCurrent ? (
                        <span className="text-xs text-[#007AFF] font-bold flex items-center justify-end gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => switchUser(u.id)}
                          className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-white/10 hover:bg-[#007AFF] hover:text-white transition-colors"
                        >
                          Switch to User
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Add New User Account
              </h3>
              <button
                onClick={() => setIsAddUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Eng. Mahmoud Nour"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. mahmoud.nour"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  System Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                >
                  <option value="System Manager">System Manager</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="User">User</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Boxes
                </label>
                <input
                  type="text"
                  value={newBoxes}
                  onChange={(e) => setNewBoxes(e.target.value)}
                  placeholder="e.g. D41, D42"
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 font-bold rounded-lg bg-[#007AFF] text-white hover:bg-[#0066D6]"
                >
                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
