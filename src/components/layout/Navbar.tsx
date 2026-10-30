import React from 'react';
import {
  Archive,
  BarChart3,
  Box as BoxIcon,
  Check,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  History,
  LayoutDashboard,
  Moon,
  Printer,
  Search,
  Settings,
  Sun,
  UploadCloud,
  UserCheck,
  Users,
} from 'lucide-react';
import { NavigationTab, useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    users,
    switchUser,
    theme,
    toggleTheme,
    setIsSearchModalOpen,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  interface NavItem {
    id: NavigationTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    requiresPermission?: boolean;
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'boxes', label: 'Boxes', icon: BoxIcon },
    { id: 'projects', label: 'Projects', icon: FileText },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'import', label: 'Import Data', icon: UploadCloud },
    { id: 'labels', label: 'Labels', icon: Printer },
    { id: 'audit', label: 'Audit Logs', icon: History },
    { id: 'users', label: 'Users', icon: Users, requiresPermission: currentUser.role === 'System Manager' },
    { id: 'settings', label: 'Settings', icon: Settings, requiresPermission: currentUser.role === 'System Manager' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-[#1C1C1E]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-white/10 transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#007AFF] text-white flex items-center justify-center shadow-sm group-hover:bg-[#0066D6] transition-colors">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap block leading-tight">
                ARMS
              </span>
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap block -mt-0.5">
                Intercom Archive
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Tabs (Icon on every top-level tab) */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {navItems.map((item) => {
            if (item.requiresPermission === false) return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#007AFF] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Search, Theme Toggle, Role Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Search Button */}
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-slate-500 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200/60 dark:border-white/5"
            title="Global Search (Cmd + K)"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline font-normal">Search Archive...</span>
            <kbd className="hidden sm:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors text-slate-800 dark:text-slate-200"
            >
              <div className="w-5 h-5 rounded-full bg-[#007AFF]/20 text-[#007AFF] flex items-center justify-center font-bold text-[10px]">
                {currentUser.full_name[0]}
              </div>
              <span className="hidden sm:inline font-semibold">{currentUser.full_name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF] font-medium hidden lg:inline">
                {currentUser.role}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isUserMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#2C2C2E] rounded-xl shadow-xl border border-slate-200 dark:border-white/10 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-white/5">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Switch Active User & Role
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Test different permissions (System Manager, Supervisor, User)
                  </div>
                </div>

                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      switchUser(u.id);
                      setIsUserMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{u.full_name}</span>
                        {u.id === currentUser.id && (
                          <Check className="w-3.5 h-3.5 text-[#007AFF]" />
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {u.role} · @{u.user_name}
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                      {u.role.replace('System ', '')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
