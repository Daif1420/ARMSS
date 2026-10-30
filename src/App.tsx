import React from 'react';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { BoxesView } from './components/boxes/BoxesView';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { ProjectDetailModal } from './components/common/ProjectDetailModal';
import { DashboardView } from './components/dashboard/DashboardView';
import { ImportView } from './components/import/ImportView';
import { LabelsView } from './components/labels/LabelsView';
import { Navbar } from './components/layout/Navbar';
import { ProjectsView } from './components/projects/ProjectsView';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { UsersView } from './components/users/UsersView';
import { AppProvider, useApp } from './context/AppContext';

const AppContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] dark:bg-[#121214] text-[#1D1D1F] dark:text-[#F5F5F7] transition-colors">
      {/* Top Navigation Bar (§12 Top Bar Contract with icon on every tab) */}
      <Navbar />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'boxes' && <BoxesView />}
        {activeTab === 'projects' && <ProjectsView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'import' && <ImportView />}
        {activeTab === 'labels' && <LabelsView />}
        {activeTab === 'users' && <UsersView />}
        {activeTab === 'settings' && <SettingsView />}
        {activeTab === 'audit' && <AuditLogsView />}
      </main>

      {/* Global Modals */}
      <GlobalSearchModal />
      <ProjectDetailModal />

      {/* Quiet Enterprise Footer (No mechanical tickers or AI slop) */}
      <footer className="mt-auto py-6 border-t border-slate-200/80 dark:border-white/10 text-xs text-slate-500 text-center no-print">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ARMS — Intercom Operational Project Reports Archive</span>
          <span>Confirmed Allocation Standard · 300 Projects / Box (6 Dossiers × 50 Slots)</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
