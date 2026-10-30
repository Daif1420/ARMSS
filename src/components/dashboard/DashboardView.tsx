import React from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Box as BoxIcon,
  CheckCircle2,
  Clock,
  FileCheck,
  FileSpreadsheet,
  FileText,
  FolderCheck,
  FolderOpen,
  HelpCircle,
  Layers,
  Package,
  PackageCheck,
  Send,
  TrendingUp,
  UploadCloud,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from '../common/Badge';

export const DashboardView: React.FC = () => {
  const {
    projects,
    boxes,
    settings,
    importBatches,
    navigateToBox,
    navigateToProjectsWithFilter,
    setActiveTab,
    setSelectedJobIdForDetail,
  } = useApp();

  // A. Source Project Volume KPIs (from imported source data)
  const totalProjectsCount = projects.length;
  const totalDocumentsCount = projects.reduce((acc, p) => acc + (p.total_document || 0), 0);
  const totalSheetsCount = projects.reduce((acc, p) => acc + (p.total_sheets || 0), 0);
  const totalSourceBoxesCount =
    settings.total_box_aggregation === 'count_distinct'
      ? new Set(projects.map((p) => p.box_number)).size
      : projects.reduce((acc, p) => acc + (p.total_box || 0), 0);

  // B. Archive Progress KPIs (actual physical archive status)
  const completedProjects = projects.filter((p) => p.status === 'Completed');
  const deliveredProjects = projects.filter((p) => p.status === 'Delivered');
  const readyForDeliveryProjects = projects.filter((p) => p.status === 'Ready for Delivery');
  const pendingProjects = projects.filter((p) => p.status === 'Pending');
  const inProgressProjects = projects.filter((p) => p.status === 'In Progress');
  const missingProjects = projects.filter((p) => p.status === 'Missing');
  const onHoldProjects = projects.filter((p) => p.status === 'On Hold');

  // Archive volume calculations
  const archivedProjectsCount = completedProjects.length + deliveredProjects.length;
  const archivedDocsCount = [...completedProjects, ...deliveredProjects].reduce((acc, p) => acc + (p.total_document || 0), 0);
  const archivedSheetsCount = [...completedProjects, ...deliveredProjects].reduce((acc, p) => acc + (p.total_sheets || 0), 0);

  // Box states
  const openBoxes = boxes.filter((b) => b.status === 'Open');
  const inProgressBoxes = boxes.filter((b) => b.status === 'In Progress');
  const completedBoxes = boxes.filter((b) => b.status === 'Completed');
  const closedBoxes = boxes.filter((b) => b.status === 'Closed');

  // Completed dossiers count
  const completedDossiersCount = boxes.reduce((acc, b) => {
    // For each box, check how many dossiers have 50 completed projects
    let count = 0;
    for (let d = 1; d <= b.dossier_count; d++) {
      const dProjects = projects.filter((p) => p.box_number === b.box_number && p.dossier_number === d);
      const isDossierDone = dProjects.length === 50 && dProjects.every((p) => p.status === 'Completed' || p.status === 'Delivered');
      if (isDossierDone) count++;
    }
    return acc + count;
  }, 0);

  const totalDossiersCount = boxes.reduce((acc, b) => acc + b.dossier_count, 0);

  // Daily delivery stats (grouped by date)
  const deliveriesByDate = React.useMemo(() => {
    const map = new Map<string, number>();
    deliveredProjects.forEach((p) => {
      const date = p.delivery_info?.delivered_at?.split('T')[0] || p.date_print || '2026-10-27';
      map.set(date, (map.get(date) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 5);
  }, [deliveredProjects]);

  // Projects requiring urgent attention (Missing, On Hold)
  const attentionProjects = React.useMemo(() => {
    return projects.filter((p) => p.status === 'Missing' || p.status === 'On Hold').slice(0, 6);
  }, [projects]);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operational Archive Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time tracking of Intercom operational project reports, box capacity, and delivery readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('import')}
            className="px-3.5 py-1.5 text-xs font-semibold bg-[#007AFF] hover:bg-[#0066D6] text-white rounded-xl shadow-sm flex items-center gap-2 transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import 'بيانات المشاريع'</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION A: SOURCE PROJECT VOLUME KPIS (Imported Source Data) */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#007AFF]" />
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Group A · Source Project Volumes (From Operational Workbooks)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Represents original report intake, not archive completion
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Projects */}
          <div
            onClick={() => navigateToProjectsWithFilter({})}
            className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF] cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Projects</span>
              <FileText className="w-4 h-4 text-[#007AFF] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalProjectsCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>All registered Job IDs</span>
              <span className="text-[#007AFF] font-medium flex items-center">
                View <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Total Documents */}
          <div
            onClick={() => navigateToProjectsWithFilter({})}
            className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF] cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Documents</span>
              <FileSpreadsheet className="w-4 h-4 text-[#007AFF] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalDocumentsCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Sum of `Total Document`</span>
              <span className="text-[#007AFF] font-medium flex items-center">
                View <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Total Sheets */}
          <div
            onClick={() => navigateToProjectsWithFilter({})}
            className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF] cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Sheets</span>
              <Layers className="w-4 h-4 text-[#007AFF] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalSheetsCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Sum of `Total Sheets`</span>
              <span className="text-[#007AFF] font-medium flex items-center">
                View <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>

          {/* Total Boxes (Source Field) */}
          <div
            onClick={() => setActiveTab('boxes')}
            className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF] cursor-pointer transition-all hover:shadow-md group"
          >
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Boxes (Source)</span>
              <Package className="w-4 h-4 text-[#007AFF] group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
              {totalSourceBoxesCount.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Aggregated by {settings.total_box_aggregation}</span>
              <span className="text-[#007AFF] font-medium flex items-center">
                Boxes <ArrowRight className="w-3 h-3 ml-0.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION B: ARCHIVE KPIS (Actual Archive Progress) */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#34C759]" />
            <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Group B · Physical Archive Progress & Status KPIs
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            Real progress inside physical boxes and dossiers
          </span>
        </div>

        {/* Primary Archive Status Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Completed */}
          <div
            onClick={() => navigateToProjectsWithFilter({ status: 'Completed' })}
            className="p-3.5 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-[#34C759] cursor-pointer transition-all group"
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Completed</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#34C759]" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
              {completedProjects.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Archived reports</span>
          </div>

          {/* Delivered */}
          <div
            onClick={() => navigateToProjectsWithFilter({ status: 'Delivered' })}
            className="p-3.5 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-[#5856D6] cursor-pointer transition-all group"
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Delivered</span>
              <PackageCheck className="w-3.5 h-3.5 text-[#5856D6]" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
              {deliveredProjects.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Handover recorded</span>
          </div>

          {/* Ready for Delivery */}
          <div
            onClick={() => navigateToProjectsWithFilter({ status: 'Ready for Delivery' })}
            className="p-3.5 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-[#30B0C7] cursor-pointer transition-all group"
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Ready for Delivery</span>
              <Send className="w-3.5 h-3.5 text-[#30B0C7]" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
              {readyForDeliveryProjects.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Awaiting handover</span>
          </div>

          {/* In Progress */}
          <div
            onClick={() => navigateToProjectsWithFilter({ status: 'In Progress' })}
            className="p-3.5 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF] cursor-pointer transition-all group"
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>In Progress</span>
              <Clock className="w-3.5 h-3.5 text-[#007AFF]" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
              {inProgressProjects.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Currently sorting</span>
          </div>

          {/* Pending */}
          <div
            onClick={() => navigateToProjectsWithFilter({ status: 'Pending' })}
            className="p-3.5 bg-white dark:bg-[#1C1C1E] rounded-xl border border-slate-200/80 dark:border-white/10 hover:border-slate-400 cursor-pointer transition-all group"
          >
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Pending</span>
              <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-1">
              {pendingProjects.length}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Not started</span>
          </div>

          {/* Missing */}
          <div
            onClick={() => navigateToProjectsWithFilter({ status: 'Missing' })}
            className="p-3.5 bg-white dark:bg-[#1C1C1E] rounded-xl border border-[#FF3B30]/30 hover:border-[#FF3B30] cursor-pointer transition-all group bg-[#FF3B30]/[0.02]"
          >
            <div className="text-[11px] font-semibold text-[#FF3B30] flex items-center justify-between">
              <span>Missing</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#FF3B30]" />
            </div>
            <div className="text-xl font-bold text-[#FF3B30] font-mono tabular-nums mt-1">
              {missingProjects.length}
            </div>
            <span className="text-[10px] text-[#FF3B30]/80 mt-0.5 block">Blocks box closure</span>
          </div>
        </div>

        {/* Secondary Detailed Archive Status Strip */}
        <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-xs divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-white/5">
          <div className="pt-2 sm:pt-0 sm:px-3">
            <span className="text-slate-400 block text-[11px]">Archived Projects</span>
            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
              {archivedProjectsCount} / {totalProjectsCount}
            </span>
            <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-[#34C759] h-full rounded-full transition-all"
                style={{ width: `${totalProjectsCount > 0 ? (archivedProjectsCount / totalProjectsCount) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3">
            <span className="text-slate-400 block text-[11px]">Archived Documents</span>
            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
              {archivedDocsCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Completed + Delivered</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3">
            <span className="text-slate-400 block text-[11px]">Archived Sheets</span>
            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
              {archivedSheetsCount.toLocaleString()}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Pages verified</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3">
            <span className="text-slate-400 block text-[11px]">Dossiers Completed</span>
            <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
              {completedDossiersCount} / {totalDossiersCount}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">50/50 projects full</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3">
            <span className="text-slate-400 block text-[11px]">Box Status Distribution</span>
            <div className="flex items-center gap-1.5 font-mono text-xs mt-1">
              <span title="Open" className="text-slate-500 font-semibold">{openBoxes.length} Open</span>
              <span>·</span>
              <span title="In Progress" className="text-[#007AFF] font-semibold">{inProgressBoxes.length} Act</span>
              <span>·</span>
              <span title="Closed" className="text-[#34C759] font-semibold">{closedBoxes.length} Cls</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{boxes.length} confirmed ranges</span>
          </div>

          <div className="pt-2 sm:pt-0 sm:px-3">
            <span className="text-slate-400 block text-[11px]">On Hold / Review</span>
            <span className="font-mono font-bold text-base text-[#FF9F0A]">
              {onHoldProjects.length}
            </span>
            <span className="text-[10px] text-slate-400 block mt-1">Temporarily paused</span>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION C: BOX COMPLETION OVERVIEW (D41 & D42) */}
      {/* ============================================================== */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Archive className="w-4 h-4 text-[#007AFF]" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
              Physical Box Completion Status
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('boxes')}
            className="text-xs text-[#007AFF] hover:underline font-semibold flex items-center gap-1"
          >
            <span>View All Boxes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boxes.map((box) => {
            const bProjects = projects.filter((p) => p.box_number === box.box_number);
            const bCompleted = bProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
            const bMissing = bProjects.filter((p) => p.status === 'Missing').length;
            const bRemaining = box.capacity - bCompleted;
            const percent = Math.min(100, Math.round((bCompleted / box.capacity) * 100));

            return (
              <div
                key={box.box_number}
                onClick={() => navigateToBox(box.box_number)}
                className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF] cursor-pointer transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-sm">
                      {box.box_number}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Box {box.box_number}</span>
                        <StatusBadge status={box.status} />
                      </h3>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">
                        Range: {box.first_project} – {box.last_project} · Capacity: {box.capacity} projects (6 Dossiers)
                      </div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#007AFF]" />
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">
                      Progress: <strong className="text-slate-900 dark:text-white">{bCompleted}</strong> / {box.capacity} completed
                    </span>
                    <span className="font-bold text-[#007AFF]">{percent}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percent === 100 ? 'bg-[#34C759]' : 'bg-[#007AFF]'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Quick stats footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Registered</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{bProjects.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Missing</span>
                    <span className={`font-semibold ${bMissing > 0 ? 'text-[#FF3B30]' : 'text-slate-500'}`}>
                      {bMissing}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">Remaining</span>
                    <span className="font-semibold text-slate-600 dark:text-slate-400">{bRemaining}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============================================================== */}
      {/* SECTION D: TWO-COLUMN DETAILS: RECENT IMPORTS & ATTENTION QUEUE */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Imports */}
        <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Workbook Imports
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('import')}
              className="text-xs text-[#007AFF] hover:underline font-semibold"
            >
              Upload New
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
            {importBatches.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                No recent workbook imports recorded.
              </div>
            ) : (
              importBatches.slice(0, 4).map((batch) => (
                <div key={batch.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-semibold text-slate-900 dark:text-white block truncate">
                      {batch.filename}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{new Date(batch.imported_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span>By {batch.imported_by}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
                      {batch.total_rows} rows
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        batch.status === 'Completed'
                          ? 'bg-[#34C759]/10 text-[#34C759]'
                          : 'bg-[#FF9F0A]/10 text-[#FF9F0A]'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Projects Requiring Attention */}
        <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF9F0A]" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Projects Requiring Attention
              </h3>
            </div>
            <button
              onClick={() => navigateToProjectsWithFilter({ status: 'Missing' })}
              className="text-xs text-[#007AFF] hover:underline font-semibold"
            >
              View Filtered
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
            {attentionProjects.length === 0 ? (
              <div className="py-6 text-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-[#34C759] opacity-60" />
                All projects are accounted for. No missing or on-hold records.
              </div>
            ) : (
              attentionProjects.map((p) => (
                <div
                  key={p.job_id}
                  onClick={() => setSelectedJobIdForDetail(p.job_id)}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-white/5 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#007AFF]">#{p.job_id}</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {p.job_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Box {p.box_number} · Dossier {p.dossier_number} · {p.branch_name}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Daily Delivery Report Strip */}
      <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-[#5856D6]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Daily Delivery Activity & Handover Report
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            Total Delivered: {deliveredProjects.length} projects
          </span>
        </div>

        {deliveriesByDate.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400">
            No deliveries logged yet. Authorized users can use "Deliver" from project or box details.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {deliveriesByDate.map(([date, count]) => (
              <div
                key={date}
                className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 rounded-xl"
              >
                <div className="text-[11px] text-slate-400 font-mono">{date}</div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                  {count} <span className="text-xs font-normal text-slate-500">projects</span>
                </div>
                <span className="text-[10px] text-[#5856D6] font-medium block mt-1">
                  Verified Archive Handover
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
