import React, { useState } from 'react';
import {
  LayoutDashboard,
  Boxes,
  FileSpreadsheet,
  BarChart3,
  UploadCloud,
  Printer,
  Users,
  Settings,
  Search,
  Sun,
  Moon,
  Shield,
  Menu,
  X,
  ScrollText,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';

export type NavTab =
  | 'dashboard'
  | 'boxes'
  | 'projects'
  | 'reports'
  | 'import'
  | 'labels'
  | 'users'
  | 'settings'
  | 'audit';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSearch,
}) => {
  const { currentUser, users, switchUser, theme, toggleTheme } = useArchive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; roleRequired?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'boxes', label: 'Boxes', icon: Boxes },
    { id: 'projects', label: 'Projects', icon: FileSpreadsheet },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'import', label: 'Import Data', icon: UploadCloud, roleRequired: 'Supervisor' },
    { id: 'labels', label: 'Labels', icon: Printer },
    { id: 'audit', label: 'Audit Logs', icon: ScrollText, roleRequired: 'Supervisor' },
    { id: 'users', label: 'Users', icon: Users, roleRequired: 'System Manager' },
    { id: 'settings', label: 'Settings', icon: Settings, roleRequired: 'System Manager' },
  ];

  // Filter tabs according to current user's role permissions
  const visibleNavItems = navItems.filter(item => {
    if (!item.roleRequired) return true;
    if (item.roleRequired === 'Supervisor') {
      return currentUser.role === 'System Manager' || currentUser.role === 'Supervisor';
    }
    if (item.roleRequired === 'System Manager') {
      return currentUser.role === 'System Manager';
    }
    return true;
  });

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#18181B]/90 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2.5 text-left group focus:outline-none"
            >
              <div className="w-8 h-8 rounded-lg bg-[#007AFF] flex items-center justify-center text-white font-bold text-sm shadow-sm group-hover:bg-[#0A84FF] transition-colors">
                A
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-nowrap block leading-tight">
                  ARMS
                </span>
                <span className="text-[11px] font-medium text-[#86868B] dark:text-[#98989D] whitespace-nowrap block leading-none">
                  Intercom Archive
                </span>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {visibleNavItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-[#007AFF] text-white shadow-xs'
                      : 'text-[#1D1D1F] dark:text-[#F5F5F7]/80 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#86868B] dark:text-[#98989D]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Action & Profile Zone */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Global Search Button */}
            <button
              onClick={onOpenSearch}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-[#86868B] dark:text-[#98989D] bg-neutral-100 dark:bg-neutral-800/80 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/80 transition-colors focus:outline-none"
              title="Global Search (Press / or click)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search archive...</span>
              <kbd className="hidden md:inline-flex items-center text-[10px] bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded px-1.5 py-0.5">
                ⌘K
              </kbd>
            </button>

            {/* Role / User Switcher */}
            <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-neutral-800/80 p-1 rounded-lg">
              <Shield className="w-3.5 h-3.5 text-[#007AFF] ml-1 shrink-0" />
              <select
                value={currentUser.username}
                onChange={e => switchUser(e.target.value)}
                className="bg-transparent text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] border-none focus:outline-none cursor-pointer pr-1"
                title="Switch active user to test RBAC roles"
              >
                {users.map(u => (
                  <option key={u.username} value={u.username} className="bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-neutral-100">
                    {u.full_name} ({u.role})
                  </option>
                ))}
              </select>
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[#86868B] dark:text-[#98989D] hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors focus:outline-none"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#18181B] px-4 pt-2 pb-4 space-y-1">
          {visibleNavItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#007AFF] text-white'
                    : 'text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-neutral-100 dark:hover:bg-neutral-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#86868B]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
