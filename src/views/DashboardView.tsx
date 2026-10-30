import React from 'react';
import {
  FileText,
  FileCheck,
  Boxes,
  Layers,
  CheckCircle2,
  Truck,
  AlertTriangle,
  Clock,
  Archive,
  ArrowRight,
  TrendingUp,
  FolderCheck,
  Sparkles,
  UploadCloud,
  Printer,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { NavTab } from '../components/Header';
import { Project, Box } from '../types';

interface DashboardViewProps {
  onNavigate: (tab: NavTab, filter?: { field: string; value: string }) => void;
  onOpenProject: (p: Project) => void;
  onOpenBox: (b: Box) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenProject,
  onOpenBox,
}) => {
  const { getSourceVolumeKpis, getArchiveKpis, boxes, projects, importBatches, getBoxStats } = useArchive();

  const sourceKpis = getSourceVolumeKpis();
  const archiveKpis = getArchiveKpis();

  // Attention required: projects that are Missing or On Hold
  const attentionProjects = projects.filter(
    p => p.archive_status === 'Missing' || p.archive_status === 'On Hold' || p.is_changed_flag
  ).slice(0, 6);

  // Recent delivered projects
  const recentDelivered = projects
    .filter(p => p.archive_status === 'Delivered')
    .slice(0, 5);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-blue-600/10 via-[#007AFF]/10 to-indigo-600/10 border border-[#007AFF]/20 dark:border-[#007AFF]/30">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-[#007AFF] uppercase tracking-wider">
              Operational Archive Console
            </span>
            <span className="text-neutral-400">·</span>
            <span className="text-xs text-neutral-500">Live Production Database</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7]">
            Intercom Physical Archive Overview
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] max-w-2xl mt-1">
            Tracking project report allocations across Box D41 (35150–35449), Box D42 (35500–35799), dossier positioning, validation, and physical vault deliveries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigate('import')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] transition-all shadow-xs"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload بيانات المشاريع</span>
          </button>
          <button
            onClick={() => onNavigate('labels')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <Printer className="w-4 h-4 text-[#007AFF]" />
            <span>Generate Labels</span>
          </button>
        </div>
      </div>

      {/* SECTION A: SOURCE PROJECT VOLUME KPIS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#007AFF]" />
              <span>Section A · Project Volume KPIs (Source Project Data)</span>
            </h2>
            <p className="text-xs text-[#86868B] dark:text-[#98989D]">
              Aggregated operational values extracted directly from source workbook metadata
            </p>
          </div>
          <button
            onClick={() => onNavigate('projects')}
            className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
          >
            <span>View All Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => onNavigate('projects')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-[#007AFF]/40 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Total Projects</span>
              <FileText className="w-4 h-4 text-[#007AFF] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
              {sourceKpis.total_projects.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-1">
              Registered operational jobs
            </div>
          </div>

          <div
            onClick={() => onNavigate('projects')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-[#007AFF]/40 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Total Documents</span>
              <FileCheck className="w-4 h-4 text-[#007AFF] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
              {sourceKpis.total_documents.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-1">
              Source file document count
            </div>
          </div>

          <div
            onClick={() => onNavigate('projects')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-[#007AFF]/40 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Total Sheets</span>
              <TrendingUp className="w-4 h-4 text-[#007AFF] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
              {sourceKpis.total_sheets.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-1">
              Total individual paper sheets
            </div>
          </div>

          <div
            onClick={() => onNavigate('projects')}
            className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-[#007AFF]/40 cursor-pointer transition-all shadow-xs group"
          >
            <div className="flex items-center justify-between text-neutral-500 mb-2">
              <span className="text-xs font-medium">Total Source Boxes</span>
              <Boxes className="w-4 h-4 text-[#007AFF] group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-2xl font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
              {sourceKpis.total_boxes.toLocaleString()}
            </div>
            <div className="text-[11px] text-[#86868B] dark:text-[#98989D] mt-1">
              Sum of source Total Box values
            </div>
          </div>
        </div>
      </div>

      {/* SECTION B: ARCHIVE KPIS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <Archive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Section B · Archive Progress KPIs (Actual Archival Operations)</span>
            </h2>
            <p className="text-xs text-[#86868B] dark:text-[#98989D]">
              Physical verification, completion, missing tracking, and delivery handovers
            </p>
          </div>
          <button
            onClick={() => onNavigate('boxes')}
            className="text-xs font-semibold text-[#007AFF] hover:underline flex items-center gap-1"
          >
            <span>Manage Boxes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Major Progress Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div
            onClick={() => onNavigate('projects', { field: 'status', value: 'Completed' })}
            className="p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-emerald-500/40 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>Completed</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
              {archiveKpis.completed_projects}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">Archived projects</div>
          </div>

          <div
            onClick={() => onNavigate('projects', { field: 'status', value: 'Delivered' })}
            className="p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-blue-500/40 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>Delivered</span>
              <Truck className="w-4 h-4 text-[#007AFF]" />
            </div>
            <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              {archiveKpis.delivered_projects}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">Handed over to vault</div>
          </div>

          <div
            onClick={() => onNavigate('projects', { field: 'status', value: 'Ready for Delivery' })}
            className="p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-indigo-500/40 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>Ready for Delivery</span>
              <FolderCheck className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 tabular-nums">
              {archiveKpis.ready_for_delivery}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">Staged for courier</div>
          </div>

          <div
            onClick={() => onNavigate('projects', { field: 'status', value: 'Missing' })}
            className="p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-rose-500/40 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>Missing Projects</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
              {archiveKpis.missing_projects}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">Unconfirmed physical files</div>
          </div>

          <div
            onClick={() => onNavigate('projects', { field: 'status', value: 'Pending' })}
            className="p-4 rounded-xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-400 cursor-pointer transition-all shadow-xs"
          >
            <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
              <span>Pending Archive</span>
              <Clock className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="text-xl font-bold font-mono text-neutral-600 dark:text-neutral-300 tabular-nums">
              {archiveKpis.pending_projects}
            </div>
            <div className="text-[10px] text-neutral-400 mt-1">Awaiting processing</div>
          </div>
        </div>

        {/* Secondary Archive Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
          <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl text-xs flex items-center justify-between">
            <span className="text-[#86868B] dark:text-[#98989D]">Archived Documents</span>
            <span className="font-mono font-bold tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
              {archiveKpis.archived_documents.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl text-xs flex items-center justify-between">
            <span className="text-[#86868B] dark:text-[#98989D]">Archived Sheets</span>
            <span className="font-mono font-bold tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
              {archiveKpis.archived_sheets.toLocaleString()}
            </span>
          </div>

          <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl text-xs flex items-center justify-between">
            <span className="text-[#86868B] dark:text-[#98989D]">Archived Dossiers</span>
            <span className="font-mono font-bold tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
              {archiveKpis.archived_dossiers} Dossiers
            </span>
          </div>

          <div className="p-3 bg-neutral-100/70 dark:bg-neutral-800/50 rounded-xl text-xs flex items-center justify-between">
            <span className="text-[#86868B] dark:text-[#98989D]">Boxes State</span>
            <span className="font-mono font-bold tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
              {archiveKpis.in_progress_boxes} Active · {archiveKpis.closed_boxes} Closed
            </span>
          </div>
        </div>
      </div>

      {/* BOX COMPLETION CARDS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-[#F5F5F7]">
            Active Archive Boxes (Confirmed Ranges)
          </h2>
          <span className="text-xs text-[#86868B] dark:text-[#98989D]">
            Click a box card to view dossiers & projects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {boxes.map(b => {
            const bStats = getBoxStats(b.box_number);
            return (
              <div
                key={b.box_number}
                onClick={() => onOpenBox(b)}
                className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 hover:border-[#007AFF] cursor-pointer transition-all shadow-xs group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold font-mono text-[#007AFF]">
                        Box {b.box_number}
                      </span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          b.status === 'Closed'
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : b.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Project Range: #{b.start_project} – #{b.end_project} (Capacity: {b.capacity})
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-lg font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                      {bStats.progress_pct}%
                    </span>
                    <div className="text-[10px] text-neutral-400">Completed</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-2.5 rounded-full overflow-hidden mb-4">
                  <div
                    className="bg-[#007AFF] h-full rounded-full transition-all duration-300"
                    style={{ width: `${bStats.progress_pct}%` }}
                  />
                </div>

                {/* Stats breakdown */}
                <div className="grid grid-cols-4 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800 text-xs">
                  <div>
                    <div className="text-[10px] text-neutral-400">Allocated</div>
                    <div className="font-mono font-bold text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                      {bStats.total_projects}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400">Archived</div>
                    <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {bStats.completed_projects + bStats.delivered_projects}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400">Missing</div>
                    <div className="font-mono font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                      {bStats.missing_projects}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-neutral-400">Remaining</div>
                    <div className="font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {bStats.remaining_projects}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ATTENTION REQUIRED & RECENT ACTIVITY DUAL GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing / Attention Projects */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Projects Requiring Attention
              </h3>
            </div>
            <span className="text-xs text-neutral-400">{attentionProjects.length} items flagged</span>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {attentionProjects.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No projects currently require immediate attention
              </div>
            ) : (
              attentionProjects.map(p => (
                <div
                  key={p.job_id}
                  onClick={() => onOpenProject(p)}
                  className="py-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#007AFF]">#{p.job_id}</span>
                      <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                        {p.job_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Box {p.box_number} · Dossier {p.dossier_number} · {p.branch_name}
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.archive_status === 'Missing'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                    }`}
                  >
                    {p.archive_status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Deliveries */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-[#007AFF]" />
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Recent Delivery Handover Log
              </h3>
            </div>
            <button
              onClick={() => onNavigate('reports', { field: 'report', value: 'deliveries' })}
              className="text-xs font-semibold text-[#007AFF] hover:underline"
            >
              Full Report
            </button>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
            {recentDelivered.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No delivery records yet
              </div>
            ) : (
              recentDelivered.map(p => (
                <div
                  key={p.job_id}
                  onClick={() => onOpenProject(p)}
                  className="py-2.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 px-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#007AFF]">#{p.job_id}</span>
                      <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                        {p.job_name}
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Handover: {p.delivery_recipient || 'Central Vault'} · {p.delivery_date}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400">
                    Delivered
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
