/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArchiveProvider, useArchive } from './context/ArchiveContext';
import { Header, NavTab } from './components/Header';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ProjectDetailModal } from './components/ProjectDetailModal';
import { BoxDetailModal } from './components/BoxDetailModal';
import { DeliveryModal } from './components/DeliveryModal';
import { LabelPrintPreview, LabelData } from './components/LabelPrintPreview';

import { DashboardView } from './views/DashboardView';
import { BoxesView } from './views/BoxesView';
import { ProjectsView } from './views/ProjectsView';
import { ImportView } from './views/ImportView';
import { LabelsView } from './views/LabelsView';
import { ReportsView } from './views/ReportsView';
import { UsersView } from './views/UsersView';
import { SettingsView } from './views/SettingsView';
import { AuditLogsView } from './views/AuditLogsView';

import { Project, Box } from './types';

const MainApp: React.FC = () => {
  const { boxes, settings } = useArchive();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [projectFilterParam, setProjectFilterParam] = useState<{ field: string; value: string } | undefined>(undefined);

  // Modals state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedBox, setSelectedBox] = useState<Box | null>(null);

  // Delivery Modal
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryProject, setDeliveryProject] = useState<Project | null>(null);
  const [deliveryBoxNumber, setDeliveryBoxNumber] = useState<string | undefined>(undefined);

  // Label Print Preview
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [printLabels, setPrintLabels] = useState<LabelData[]>([]);

  const handleNavigate = (tab: NavTab, filter?: { field: string; value: string }) => {
    setActiveTab(tab);
    if (filter) {
      setProjectFilterParam(filter);
    } else {
      setProjectFilterParam(undefined);
    }
  };

  const handleOpenDelivery = (p: Project) => {
    setDeliveryProject(p);
    setDeliveryBoxNumber(undefined);
    setDeliveryModalOpen(true);
  };

  const handleDeliverBox = (boxNumber: string) => {
    setDeliveryProject(null);
    setDeliveryBoxNumber(boxNumber);
    setDeliveryModalOpen(true);
  };

  const handlePrintProjectLabel = (p: Project) => {
    setPrintLabels([
      {
        type: 'project',
        title: p.job_name,
        box_number: p.box_number,
        dossier_number: p.dossier_number,
        job_id: p.job_id,
        branch_name: p.branch_name,
        date: p.date_print,
        barcode_value: `JOB-${p.job_id}`,
      },
    ]);
    setPrintPreviewOpen(true);
  };

  const handlePrintBoxLabel = (boxNumber: string) => {
    const box = boxes.find(b => b.box_number === boxNumber);
    if (!box) return;

    setPrintLabels([
      {
        type: 'box',
        title: `Intercom Physical Archive Box ${box.box_number}`,
        box_number: box.box_number,
        project_start: box.start_project,
        project_end: box.end_project,
        project_count: box.capacity,
        barcode_value: `BOX-${box.box_number}-${box.start_project}`,
      },
    ]);
    setPrintPreviewOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] dark:bg-[#121214] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans transition-colors">
      {/* Apple-Inspired Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={handleNavigate}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Viewport Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            onNavigate={handleNavigate}
            onOpenProject={setSelectedProject}
            onOpenBox={setSelectedBox}
          />
        )}

        {activeTab === 'boxes' && (
          <BoxesView
            onOpenBox={setSelectedBox}
            onPrintBoxLabel={handlePrintBoxLabel}
            onDeliverBox={handleDeliverBox}
          />
        )}

        {activeTab === 'projects' && (
          <ProjectsView
            onOpenProject={setSelectedProject}
            onOpenDelivery={handleOpenDelivery}
            onPrintLabel={handlePrintProjectLabel}
            initialFilter={projectFilterParam}
          />
        )}

        {activeTab === 'import' && <ImportView />}

        {activeTab === 'labels' && <LabelsView />}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'audit' && <AuditLogsView />}

        {activeTab === 'users' && <UsersView />}

        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Modals & Overlays */}
      <GlobalSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectProject={setSelectedProject}
      />

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        onOpenDelivery={handleOpenDelivery}
        onPrintLabel={handlePrintProjectLabel}
      />

      <BoxDetailModal
        box={selectedBox}
        onClose={() => setSelectedBox(null)}
        onSelectProject={setSelectedProject}
        onPrintBoxLabel={handlePrintBoxLabel}
        onDeliverBox={handleDeliverBox}
      />

      <DeliveryModal
        isOpen={deliveryModalOpen}
        onClose={() => setDeliveryModalOpen(false)}
        project={deliveryProject}
        boxNumber={deliveryBoxNumber}
      />

      <LabelPrintPreview
        isOpen={printPreviewOpen}
        onClose={() => setPrintPreviewOpen(false)}
        labels={printLabels}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-neutral-200/60 dark:border-neutral-800/80 py-4 bg-white/50 dark:bg-neutral-900/40 text-center text-xs text-[#86868B] dark:text-[#98989D] no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ARMS — Intercom Operational Archive Management System</span>
          <span>Approved Capacities: Box (300) · 6 Dossiers · 50 Projects/Dossier</span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ArchiveProvider>
      <MainApp />
    </ArchiveProvider>
  );
}
