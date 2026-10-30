import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Package,
  PackageCheck,
  Printer,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
import { getDossiersForBox } from '../../utils/allocation';
import { exportToXlsx } from '../../utils/excelParser';
import { StatusBadge } from '../common/Badge';

export type ReportType =
  | 'completed'
  | 'missing'
  | 'delivered'
  | 'pending'
  | 'in_progress'
  | 'box_status'
  | 'dossier_status'
  | 'archive_summary'
  | 'delivery'
  | 'import_history'
  | 'import_conflicts'
  | 'user_activity'
  | 'audit_logs';

export const ReportsView: React.FC = () => {
  const {
    projects,
    boxes,
    auditLogs,
    importBatches,
    users,
    setSelectedJobIdForDetail,
  } = useApp();

  const [activeReport, setActiveReport] = useState<ReportType>('archive_summary');

  // Filter controls
  const [search, setSearch] = useState('');
  const [selectedBox, setSelectedBox] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const reportList: { id: ReportType; label: string; icon: React.ComponentType<{ className?: string }>; category: string }[] = [
    { id: 'archive_summary', label: 'Archive Summary', icon: BarChart3, category: 'Overview' },
    { id: 'box_status', label: 'Box Status Report', icon: Package, category: 'Archive Units' },
    { id: 'dossier_status', label: 'Dossier Status Report', icon: FileSpreadsheet, category: 'Archive Units' },
    { id: 'completed', label: 'Completed Projects', icon: CheckCircle2, category: 'Projects' },
    { id: 'missing', label: 'Missing Projects', icon: AlertCircle, category: 'Projects' },
    { id: 'delivered', label: 'Delivered Projects', icon: PackageCheck, category: 'Projects' },
    { id: 'pending', label: 'Pending Projects', icon: FileText, category: 'Projects' },
    { id: 'in_progress', label: 'In Progress Projects', icon: FileText, category: 'Projects' },
    { id: 'delivery', label: 'Delivery Handover Report', icon: PackageCheck, category: 'Deliveries' },
    { id: 'import_history', label: 'Import History', icon: History, category: 'Operations' },
    { id: 'import_conflicts', label: 'Import Errors & Conflicts', icon: AlertCircle, category: 'Operations' },
    { id: 'user_activity', label: 'User Activity Report', icon: Users, category: 'Security & Access' },
    { id: 'audit_logs', label: 'Central Audit Logs', icon: ShieldCheck, category: 'Security & Access' },
  ];

  // Unique branches
  const branches = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.branch_name))).filter(Boolean);
  }, [projects]);

  // General Filter for Projects
  const filterProject = (p: Project) => {
    const matchesSearch =
      search === '' ||
      String(p.job_id).includes(search) ||
      p.job_name.toLowerCase().includes(search.toLowerCase()) ||
      p.branch_name.toLowerCase().includes(search.toLowerCase());
    const matchesBox = selectedBox === 'all' || p.box_number === selectedBox;
    const matchesBranch = selectedBranch === 'all' || p.branch_name === selectedBranch;
    const matchesFrom = !dateFrom || (p.date_print && p.date_print >= dateFrom);
    const matchesTo = !dateTo || (p.date_print && p.date_print <= dateTo);

    return matchesSearch && matchesBox && matchesBranch && matchesFrom && matchesTo;
  };

  // Export handlers
  const handleExportExcel = () => {
    const filename = `ARMS_Report_${activeReport}_${new Date().toISOString().split('T')[0]}`;

    if (
      activeReport === 'completed' ||
      activeReport === 'missing' ||
      activeReport === 'delivered' ||
      activeReport === 'pending' ||
      activeReport === 'in_progress'
    ) {
      const targetStatus: Record<string, ProjectStatus> = {
        completed: 'Completed',
        missing: 'Missing',
        delivered: 'Delivered',
        pending: 'Pending',
        in_progress: 'In Progress',
      };
      const data = projects
        .filter((p) => p.status === targetStatus[activeReport] && filterProject(p))
        .map((p) => ({
          'Job ID': p.job_id,
          'Job Name': p.job_name,
          'Branch Name': p.branch_name,
          'Box Number': p.box_number,
          'Dossier Number': p.dossier_number,
          'Total Box': p.total_box,
          'Total Document': p.total_document,
          'Total Sheets': p.total_sheets,
          'Date Print': p.date_print,
          Status: p.status,
          'Delivered At': p.delivery_info?.delivered_at || '',
          'Delivered By': p.delivery_info?.delivered_by || '',
        }));
      exportToXlsx(data, filename);
    } else if (activeReport === 'box_status') {
      const data = boxes.map((b) => {
        const bProjs = projects.filter((p) => p.box_number === b.box_number);
        const comp = bProjs.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
        const miss = bProjs.filter((p) => p.status === 'Missing').length;
        return {
          'Box Number': b.box_number,
          'First Project': b.first_project,
          'Last Project': b.last_project,
          Capacity: b.capacity,
          'Dossiers Count': b.dossier_count,
          'Registered Projects': bProjs.length,
          'Completed Projects': comp,
          'Missing Projects': miss,
          'Remaining Projects': b.capacity - comp,
          Status: b.status,
        };
      });
      exportToXlsx(data, filename);
    } else if (activeReport === 'delivery') {
      const data = projects
        .filter((p) => p.status === 'Delivered' && filterProject(p))
        .map((p) => ({
          'Job ID': p.job_id,
          'Job Name': p.job_name,
          'Branch Name': p.branch_name,
          'Box Number': p.box_number,
          'Dossier Number': p.dossier_number,
          'Delivered At': p.delivery_info?.delivered_at || '',
          'Delivered By': p.delivery_info?.delivered_by || '',
          Recipient: p.delivery_info?.recipient || '',
          Notes: p.delivery_info?.notes || '',
        }));
      exportToXlsx(data, filename);
    } else if (activeReport === 'audit_logs') {
      const data = auditLogs.map((l) => ({
        Timestamp: l.timestamp,
        Actor: l.actor,
        Role: l.actor_role,
        Action: l.action,
        'Entity Type': l.entity_type,
        'Entity ID': l.entity_id,
        Details: l.details || '',
        Reason: l.reason || '',
      }));
      exportToXlsx(data, filename);
    } else {
      // General projects dump
      const data = projects.filter(filterProject).map((p) => ({
        'Job ID': p.job_id,
        'Job Name': p.job_name,
        'Branch Name': p.branch_name,
        'Box Number': p.box_number,
        'Dossier Number': p.dossier_number,
        Status: p.status,
        'Date Print': p.date_print,
      }));
      exportToXlsx(data, filename);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Operational Reports & Auditing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate, filter, and export verified archive status, missing lists, delivery handovers, and compliance logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Export Excel (.XLSX)</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report (PDF)</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Sidebar of Reports + Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Report Selector Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-4 no-print">
          <div className="p-3 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 block">
              13 Required ARMS Reports (§9)
            </span>
            <div className="space-y-0.5">
              {reportList.map((rep) => {
                const Icon = rep.icon;
                const isActive = activeReport === rep.id;
                return (
                  <button
                    key={rep.id}
                    onClick={() => setActiveReport(rep.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                      isActive
                        ? 'bg-[#007AFF] text-white font-semibold shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{rep.label}</span>
                    </div>
                    <ChevronRight className={`w-3 h-3 ${isActive ? 'text-white' : 'text-slate-300'}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Report Content View (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3 no-print">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Search */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Search
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search Job ID or Name..."
                    className="w-full text-xs pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              {/* Box filter */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Box Filter
                </label>
                <select
                  value={selectedBox}
                  onChange={(e) => setSelectedBox(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                >
                  <option value="all">All Boxes</option>
                  {boxes.map((b) => (
                    <option key={b.box_number} value={b.box_number}>
                      Box {b.box_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Branch filter */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Branch Filter
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                >
                  <option value="all">All Branches</option>
                  {branches.map((br) => (
                    <option key={br} value={br}>
                      {br}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Date Range
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none"
                  />
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full text-xs px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Active Report Rendering */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm p-6 space-y-4">
            {/* Header in report */}
            <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  INTERCOM ARCHIVE MANAGEMENT REPORT
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {activeReport.replace(/_/g, ' ')}
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Generated: {new Date().toLocaleString()}
              </span>
            </div>

            {/* Render 1: Archive Summary */}
            {activeReport === 'archive_summary' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                    <span className="text-[11px] text-slate-500 uppercase block">Total Reports Intake</span>
                    <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                      {projects.length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                    <span className="text-[11px] text-slate-500 uppercase block">Completed & Archived</span>
                    <span className="text-2xl font-bold font-mono text-[#34C759] mt-1 block">
                      {projects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                    <span className="text-[11px] text-slate-500 uppercase block">Delivered Handover</span>
                    <span className="text-2xl font-bold font-mono text-[#5856D6] mt-1 block">
                      {projects.filter((p) => p.status === 'Delivered').length}
                    </span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5">
                    <span className="text-[11px] text-slate-500 uppercase block">Missing Reports</span>
                    <span className="text-2xl font-bold font-mono text-[#FF3B30] mt-1 block">
                      {projects.filter((p) => p.status === 'Missing').length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Confirmed Box Breakdown
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-semibold uppercase">
                          <th className="py-2 px-3">Box</th>
                          <th className="py-2 px-3">Range</th>
                          <th className="py-2 px-3">Capacity</th>
                          <th className="py-2 px-3">Completed</th>
                          <th className="py-2 px-3">Missing</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                        {boxes.map((b) => {
                          const bProjs = projects.filter((p) => p.box_number === b.box_number);
                          const comp = bProjs.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
                          const miss = bProjs.filter((p) => p.status === 'Missing').length;
                          return (
                            <tr key={b.box_number}>
                              <td className="py-2.5 px-3 font-bold text-[#007AFF]">Box {b.box_number}</td>
                              <td className="py-2.5 px-3">{b.first_project} – {b.last_project}</td>
                              <td className="py-2.5 px-3">{b.capacity}</td>
                              <td className="py-2.5 px-3 text-[#34C759] font-bold">{comp}</td>
                              <td className="py-2.5 px-3 text-[#FF3B30] font-bold">{miss}</td>
                              <td className="py-2.5 px-3"><StatusBadge status={b.status} /></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Render 2: Specific Project Lists (Completed, Missing, Delivered, Pending, In Progress) */}
            {(activeReport === 'completed' ||
              activeReport === 'missing' ||
              activeReport === 'delivered' ||
              activeReport === 'pending' ||
              activeReport === 'in_progress') && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase">
                      <th className="py-2.5 px-4">Job ID</th>
                      <th className="py-2.5 px-4">Job Name</th>
                      <th className="py-2.5 px-4">Branch</th>
                      <th className="py-2.5 px-4">Box / Dossier</th>
                      <th className="py-2.5 px-4">Date Print</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {projects
                      .filter((p) => {
                        const statusMap: Record<string, ProjectStatus> = {
                          completed: 'Completed',
                          missing: 'Missing',
                          delivered: 'Delivered',
                          pending: 'Pending',
                          in_progress: 'In Progress',
                        };
                        return p.status === statusMap[activeReport] && filterProject(p);
                      })
                      .map((p) => (
                        <tr
                          key={p.job_id}
                          onClick={() => setSelectedJobIdForDetail(p.job_id)}
                          className="hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer"
                        >
                          <td className="py-2.5 px-4 font-mono font-bold text-[#007AFF]">#{p.job_id}</td>
                          <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                            {p.job_name}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500">{p.branch_name}</td>
                          <td className="py-2.5 px-4 font-mono">
                            {p.box_number} / D{p.dossier_number}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">{p.date_print || '—'}</td>
                          <td className="py-2.5 px-4"><StatusBadge status={p.status} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 3: Box Status Report */}
            {activeReport === 'box_status' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Box</th>
                      <th className="py-2.5 px-4">Range</th>
                      <th className="py-2.5 px-4">Capacity</th>
                      <th className="py-2.5 px-4">Registered</th>
                      <th className="py-2.5 px-4 text-[#34C759]">Completed</th>
                      <th className="py-2.5 px-4 text-[#FF3B30]">Missing</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                    {boxes.map((b) => {
                      const bProjs = projects.filter((p) => p.box_number === b.box_number);
                      const comp = bProjs.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
                      const miss = bProjs.filter((p) => p.status === 'Missing').length;
                      return (
                        <tr key={b.box_number}>
                          <td className="py-3 px-4 font-bold text-[#007AFF]">Box {b.box_number}</td>
                          <td className="py-3 px-4">{b.first_project} – {b.last_project}</td>
                          <td className="py-3 px-4">{b.capacity}</td>
                          <td className="py-3 px-4 font-semibold">{bProjs.length}</td>
                          <td className="py-3 px-4 text-[#34C759] font-bold">{comp}</td>
                          <td className="py-3 px-4 text-[#FF3B30] font-bold">{miss}</td>
                          <td className="py-3 px-4"><StatusBadge status={b.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 4: Dossier Status Report */}
            {activeReport === 'dossier_status' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Box</th>
                      <th className="py-2.5 px-4">Dossier</th>
                      <th className="py-2.5 px-4">Positions</th>
                      <th className="py-2.5 px-4">Expected Job Range</th>
                      <th className="py-2.5 px-4 text-[#34C759]">Completed</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                    {boxes.flatMap((b) =>
                      getDossiersForBox(b, projects).map((d) => {
                        const dProjs = projects.filter((p) => p.box_number === b.box_number && p.dossier_number === d.dossier_number);
                        const comp = dProjs.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
                        return (
                          <tr key={`${b.box_number}-D${d.dossier_number}`}>
                            <td className="py-2.5 px-4 font-bold text-[#007AFF]">{b.box_number}</td>
                            <td className="py-2.5 px-4 font-semibold">Dossier {d.dossier_number}</td>
                            <td className="py-2.5 px-4">{d.position_range}</td>
                            <td className="py-2.5 px-4">{d.first_project} – {d.last_project}</td>
                            <td className="py-2.5 px-4 text-[#34C759] font-bold">{comp} / {d.capacity}</td>
                            <td className="py-2.5 px-4"><StatusBadge status={d.status} /></td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 5: Delivery Report */}
            {activeReport === 'delivery' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Job ID</th>
                      <th className="py-2.5 px-4">Delivered At</th>
                      <th className="py-2.5 px-4">Operator</th>
                      <th className="py-2.5 px-4">Recipient Destination</th>
                      <th className="py-2.5 px-4">Archive Location</th>
                      <th className="py-2.5 px-4">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {projects
                      .filter((p) => p.status === 'Delivered' && filterProject(p))
                      .map((p) => (
                        <tr key={p.job_id}>
                          <td className="py-2.5 px-4 font-mono font-bold text-[#007AFF]">#{p.job_id}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">
                            {p.delivery_info?.delivered_at ? new Date(p.delivery_info.delivered_at).toLocaleString() : '—'}
                          </td>
                          <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                            {p.delivery_info?.delivered_by || 'System'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {p.delivery_info?.recipient || 'Archive Handover'}
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500">
                            Box {p.box_number} / D{p.dossier_number}
                          </td>
                          <td className="py-2.5 px-4 text-slate-500 italic">
                            {p.delivery_info?.notes || '—'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 6: Audit Logs in Report */}
            {(activeReport === 'audit_logs' || activeReport === 'user_activity') && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Actor</th>
                      <th className="py-2.5 px-4">Role</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {auditLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="py-2.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {log.actor}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                          {log.actor_role}
                        </td>
                        <td className="py-2.5 px-4 font-mono font-bold text-xs text-[#007AFF] whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                          {log.details}
                          {log.reason && (
                            <span className="block text-amber-600 dark:text-amber-400 font-medium text-[11px] mt-0.5">
                              Reason: {log.reason}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Render 7: Import History */}
            {activeReport === 'import_history' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Filename</th>
                      <th className="py-2.5 px-4">Imported At</th>
                      <th className="py-2.5 px-4">User</th>
                      <th className="py-2.5 px-4">Total</th>
                      <th className="py-2.5 px-4 text-[#007AFF]">New</th>
                      <th className="py-2.5 px-4 text-[#FF9F0A]">Changed</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono">
                    {importBatches.map((b) => (
                      <tr key={b.id}>
                        <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">{b.filename}</td>
                        <td className="py-2.5 px-4 text-slate-500">{new Date(b.imported_at).toLocaleString()}</td>
                        <td className="py-2.5 px-4">{b.imported_by}</td>
                        <td className="py-2.5 px-4 font-bold">{b.total_rows}</td>
                        <td className="py-2.5 px-4 text-[#007AFF] font-bold">{b.new_count}</td>
                        <td className="py-2.5 px-4 text-[#FF9F0A] font-bold">{b.changed_count}</td>
                        <td className="py-2.5 px-4 font-sans"><StatusBadge status={b.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
