import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Search,
  Filter,
  FileCheck,
  Truck,
  AlertTriangle,
  Clock,
  Boxes,
  Folder,
  Layers,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { exportToExcel } from '../utils/excel';

export type ReportType =
  | 'completed'
  | 'missing'
  | 'delivered'
  | 'pending'
  | 'in_progress'
  | 'box_status'
  | 'dossier_status'
  | 'archive_summary'
  | 'delivery_report'
  | 'import_history'
  | 'import_conflicts'
  | 'user_activity'
  | 'audit_logs';

interface ReportsViewProps {
  initialReport?: ReportType;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ initialReport }) => {
  const { projects, boxes, importBatches, auditLogs, getBoxStats } = useArchive();

  const [selectedReport, setSelectedReport] = useState<ReportType>(initialReport || 'archive_summary');
  const [search, setSearch] = useState('');
  const [selectedBox, setSelectedBox] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');

  const reportDefinitions: { id: ReportType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'archive_summary', label: 'Archive Summary', icon: Layers },
    { id: 'completed', label: 'Completed Projects', icon: FileCheck },
    { id: 'missing', label: 'Missing Projects', icon: AlertTriangle },
    { id: 'delivered', label: 'Delivered Projects', icon: Truck },
    { id: 'pending', label: 'Pending Projects', icon: Clock },
    { id: 'in_progress', label: 'In Progress Projects', icon: Clock },
    { id: 'box_status', label: 'Box Status Report', icon: Boxes },
    { id: 'dossier_status', label: 'Dossier Status Report', icon: Folder },
    { id: 'delivery_report', label: 'Delivery Log Report', icon: Truck },
    { id: 'import_history', label: 'Import History', icon: History },
    { id: 'audit_logs', label: 'System Audit Logs', icon: ShieldCheck },
  ];

  // Branches
  const branches = useMemo(() => {
    const s = new Set<string>();
    projects.forEach(p => p.branch_name && s.add(p.branch_name));
    return Array.from(s).sort();
  }, [projects]);

  // Compute table data based on selected report
  const tableData = useMemo(() => {
    let raw: any[] = [];

    if (
      selectedReport === 'completed' ||
      selectedReport === 'missing' ||
      selectedReport === 'delivered' ||
      selectedReport === 'pending' ||
      selectedReport === 'in_progress'
    ) {
      const statusMap: Record<string, string> = {
        completed: 'Completed',
        missing: 'Missing',
        delivered: 'Delivered',
        pending: 'Pending',
        in_progress: 'In Progress',
      };
      const targetStatus = statusMap[selectedReport];
      raw = projects
        .filter(p => p.archive_status === targetStatus)
        .map(p => ({
          'Job ID': p.job_id,
          'Job Name': p.job_name,
          'Branch Name': p.branch_name,
          'Box': p.box_number,
          'Dossier': p.dossier_number,
          'Position': p.dossier_position,
          'Total Box': p.total_box,
          'Total Document': p.total_document,
          'Total Sheets': p.total_sheets,
          'Date Print': p.date_print,
          'Status': p.archive_status,
          'Delivery Info': p.delivery_recipient || p.delivery_date || 'N/A',
        }));
    } else if (selectedReport === 'box_status') {
      raw = boxes.map(b => {
        const stats = getBoxStats(b.box_number);
        return {
          'Box Number': b.box_number,
          'Capacity': b.capacity,
          'Allocated Projects': stats.total_projects,
          'Completed Projects': stats.completed_projects,
          'Delivered Projects': stats.delivered_projects,
          'Missing Projects': stats.missing_projects,
          'Remaining Projects': stats.remaining_projects,
          'Progress Pct': `${stats.progress_pct}%`,
          'Status': b.status,
          'Closure Type': b.is_override_closed ? 'Manager Override' : 'Standard',
        };
      });
    } else if (selectedReport === 'dossier_status') {
      const list: any[] = [];
      boxes.forEach(b => {
        for (let d = 1; d <= b.dossier_count; d++) {
          const dProjects = projects.filter(p => p.box_number === b.box_number && p.dossier_number === d);
          const dComp = dProjects.filter(p => p.archive_status === 'Completed' || p.archive_status === 'Delivered').length;
          const dMiss = dProjects.filter(p => p.archive_status === 'Missing').length;
          const dProg = dProjects.length > 0 ? Math.round((dComp / dProjects.length) * 100) : 0;
          list.push({
            'Box': b.box_number,
            'Dossier': d,
            'Capacity': 50,
            'Allocated Count': dProjects.length,
            'Completed Count': dComp,
            'Missing Count': dMiss,
            'Progress': `${dProg}%`,
            'Status': dProg === 100 ? 'Completed' : dProg > 0 ? 'In Progress' : 'Pending',
          });
        }
      });
      raw = list;
    } else if (selectedReport === 'delivery_report') {
      raw = projects
        .filter(p => p.archive_status === 'Delivered')
        .map(p => ({
          'Job ID': p.job_id,
          'Job Name': p.job_name,
          'Branch Name': p.branch_name,
          'Box': p.box_number,
          'Dossier': p.dossier_number,
          'Delivery Date': p.delivery_date || '',
          'Courier / Recipient': p.delivery_recipient || '',
          'Dispatched By': p.delivery_by || '',
          'Notes': p.delivery_notes || '',
        }));
    } else if (selectedReport === 'import_history') {
      raw = importBatches.map(b => ({
        'Batch ID': b.id,
        'Filename': b.filename,
        'Import Date': b.imported_at,
        'Operator': b.imported_by,
        'Total Rows': b.total_rows,
        'New Records': b.new_count,
        'Changed Records': b.changed_count,
        'Duplicates': b.duplicate_count,
        'Errors': b.error_count,
        'Status': b.status,
      }));
    } else if (selectedReport === 'audit_logs') {
      raw = auditLogs.map(l => ({
        'Log ID': l.id,
        'Timestamp': l.timestamp,
        'Operator': l.actor,
        'Action': l.action,
        'Entity Type': l.entity_type,
        'Entity ID': l.entity_id,
        'Old Value': l.old_value || '',
        'New Value': l.new_value || '',
        'Reason': l.reason || '',
      }));
    } else {
      // Archive Summary
      raw = boxes.map(b => {
        const stats = getBoxStats(b.box_number);
        return {
          'Archive Box': b.box_number,
          'Project Range': `#${b.start_project} – #${b.end_project}`,
          'Box Capacity': b.capacity,
          'Total Assigned': stats.total_projects,
          'Archived (Completed + Delivered)': stats.completed_projects + stats.delivered_projects,
          'Missing Projects': stats.missing_projects,
          'Remaining Work': stats.remaining_projects,
          'Overall Box Progress': `${stats.progress_pct}%`,
          'Box Status': b.status,
        };
      });
    }

    // Filter by search / box / branch
    return raw.filter(row => {
      const rowStr = JSON.stringify(row).toLowerCase();
      const matchesSearch = !search.trim() || rowStr.includes(search.trim().toLowerCase());
      const matchesBox = selectedBox === 'all' || rowStr.includes(selectedBox.toLowerCase());
      const matchesBranch = selectedBranch === 'all' || rowStr.includes(selectedBranch.toLowerCase());
      return matchesSearch && matchesBox && matchesBranch;
    });
  }, [selectedReport, projects, boxes, importBatches, auditLogs, search, selectedBox, selectedBranch, getBoxStats]);

  const handleExportExcel = () => {
    exportToExcel(
      tableData,
      `ARMS_${selectedReport.toUpperCase()}_${new Date().toISOString().split('T')[0]}`,
      selectedReport
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const sampleHeaders = tableData[0] ? Object.keys(tableData[0]) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#007AFF]" />
            <span>Operational Archive Reports</span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
            Filter, inspect, export to Excel, and generate print-ready documentation for audits & management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] transition-all shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to Excel ({tableData.length})</span>
          </button>
        </div>
      </div>

      {/* Report Categories Horizontal Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none border-b border-neutral-200 dark:border-neutral-800 pb-2">
        {reportDefinitions.map(rep => {
          const Icon = rep.icon;
          const isSelected = selectedReport === rep.id;
          return (
            <button
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#007AFF] text-white shadow-xs'
                  : 'text-[#1D1D1F] dark:text-[#F5F5F7]/70 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{rep.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Strip */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#1C1C1E] rounded-xl border border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search within report results..."
            className="w-full text-xs bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Box:</span>
            <select
              value={selectedBox}
              onChange={e => setSelectedBox(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] px-2 py-1 rounded-lg text-xs border-none focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              {boxes.map(b => (
                <option key={b.box_number} value={b.box_number}>
                  {b.box_number}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <span>Branch:</span>
            <select
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] px-2 py-1 rounded-lg text-xs border-none focus:outline-none cursor-pointer"
            >
              <option value="all">All</option>
              {branches.map(br => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Report Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#18181B] shadow-xs">
        <div className="overflow-x-auto max-h-[600px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 dark:bg-neutral-900/90 sticky top-0 text-[#86868B] dark:text-[#98989D] border-b border-neutral-200 dark:border-neutral-800 font-semibold select-none">
              <tr>
                {sampleHeaders.map(h => (
                  <th key={h} className="py-2.5 px-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {tableData.length === 0 ? (
                <tr>
                  <td colSpan={sampleHeaders.length || 1} className="py-12 text-center text-neutral-400">
                    No records found for this report and filter
                  </td>
                </tr>
              ) : (
                tableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    {sampleHeaders.map(h => {
                      const val = row[h];
                      const isNum = typeof val === 'number' || (typeof val === 'string' && val.endsWith('%'));
                      return (
                        <td
                          key={h}
                          className={`py-2 px-3 whitespace-nowrap ${
                            isNum ? 'font-mono tabular-nums text-right' : 'text-[#1D1D1F] dark:text-[#F5F5F7]'
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
