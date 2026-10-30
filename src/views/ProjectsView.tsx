import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  Printer,
  Truck,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { Project, ProjectStatus } from '../types';
import { exportToExcel } from '../utils/excel';

interface ProjectsViewProps {
  onOpenProject: (p: Project) => void;
  onOpenDelivery: (p: Project) => void;
  onPrintLabel: (p: Project) => void;
  initialFilter?: { field: string; value: string };
}

type SortField =
  | 'job_id'
  | 'job_name'
  | 'branch_name'
  | 'box_number'
  | 'dossier_number'
  | 'total_box'
  | 'total_document'
  | 'total_sheets'
  | 'date_print'
  | 'archive_status';

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  onOpenProject,
  onOpenDelivery,
  onPrintLabel,
  initialFilter,
}) => {
  const { projects, boxes, updateProjectStatus, currentUser } = useArchive();

  const [search, setSearch] = useState('');
  const [selectedBox, setSelectedBox] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter?.field === 'status' ? initialFilter.value : 'all');
  const [sortField, setSortField] = useState<SortField>('job_id');
  const [sortAsc, setSortAsc] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const pageSize = 25;

  // Extract unique branches
  const branches = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => {
      if (p.branch_name) set.add(p.branch_name);
    });
    return Array.from(set).sort();
  }, [projects]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        const matchesSearch =
          String(p.job_id).includes(search.trim()) ||
          p.job_name.toLowerCase().includes(search.toLowerCase()) ||
          p.branch_name.toLowerCase().includes(search.toLowerCase());
        const matchesBox = selectedBox === 'all' || p.box_number === selectedBox;
        const matchesBranch = selectedBranch === 'all' || p.branch_name === selectedBranch;
        const matchesStatus = selectedStatus === 'all' || p.archive_status === selectedStatus;

        return matchesSearch && matchesBox && matchesBranch && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortField === 'job_id') comparison = a.job_id - b.job_id;
        else if (sortField === 'job_name') comparison = a.job_name.localeCompare(b.job_name);
        else if (sortField === 'branch_name') comparison = a.branch_name.localeCompare(b.branch_name);
        else if (sortField === 'box_number') comparison = a.box_number.localeCompare(b.box_number);
        else if (sortField === 'dossier_number') comparison = a.dossier_number - b.dossier_number;
        else if (sortField === 'total_box') comparison = a.total_box - b.total_box;
        else if (sortField === 'total_document') comparison = a.total_document - b.total_document;
        else if (sortField === 'total_sheets') comparison = a.total_sheets - b.total_sheets;
        else if (sortField === 'date_print') comparison = a.date_print.localeCompare(b.date_print);
        else if (sortField === 'archive_status') comparison = a.archive_status.localeCompare(b.archive_status);

        return sortAsc ? comparison : -comparison;
      });
  }, [projects, search, selectedBox, selectedBranch, selectedStatus, sortField, sortAsc]);

  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = filteredProjects.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleSelectAll = () => {
    if (selectedIds.length === paginatedProjects.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedProjects.map(p => p.job_id));
    }
  };

  const toggleSelectOne = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  };

  const handleExport = () => {
    const exportData = filteredProjects.map(p => ({
      'Job ID': p.job_id,
      'Job Name': p.job_name,
      'Branch Name': p.branch_name,
      'Box': p.box_number,
      'Dossier': p.dossier_number,
      'Dossier Pos': p.dossier_position,
      'Total Box': p.total_box,
      'Total Document': p.total_document,
      'Total Sheets': p.total_sheets,
      'Date Print': p.date_print,
      'Archive Status': p.archive_status,
      'Delivery Date': p.delivery_date || '',
      'Delivery Recipient': p.delivery_recipient || '',
    }));
    exportToExcel(exportData, `Intercom_Projects_Export_${new Date().toISOString().split('T')[0]}`);
  };

  const handleBulkStatus = (status: ProjectStatus) => {
    if (selectedIds.length === 0) return;
    selectedIds.forEach(id => {
      updateProjectStatus(id, status, `Bulk status change to ${status}`);
    });
    setSelectedIds([]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#007AFF]" />
            <span>Master Projects Archive</span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
            Search, sort, filter, and manage individual project operational reports and archive assignments
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Export Filtered ({filteredProjects.length})</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Controls Strip */}
      <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-neutral-200/80 dark:border-neutral-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <Search className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search Job ID, Name, Branch..."
              className="w-full text-xs bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none"
            />
          </div>

          {/* Box Filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <span className="text-xs text-neutral-400 shrink-0">Box:</span>
            <select
              value={selectedBox}
              onChange={e => {
                setSelectedBox(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none cursor-pointer"
            >
              <option value="all">All Boxes</option>
              {boxes.map(b => (
                <option key={b.box_number} value={b.box_number}>
                  Box {b.box_number} (#{b.start_project}–#{b.end_project})
                </option>
              ))}
            </select>
          </div>

          {/* Branch Filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <span className="text-xs text-neutral-400 shrink-0">Branch:</span>
            <select
              value={selectedBranch}
              onChange={e => {
                setSelectedBranch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none cursor-pointer"
            >
              <option value="all">All Branches</option>
              {branches.map(br => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 px-3 py-2 bg-neutral-100 dark:bg-neutral-800/70 rounded-xl border border-neutral-200 dark:border-neutral-700">
            <span className="text-xs text-neutral-400 shrink-0">Status:</span>
            <select
              value={selectedStatus}
              onChange={e => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Missing">Missing</option>
              <option value="On Hold">On Hold</option>
              <option value="Ready for Delivery">Ready for Delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Bar (when rows are selected) */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-medium">
              <span>{selectedIds.length} projects selected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Bulk Mark As:</span>
              <button
                onClick={() => handleBulkStatus('Completed')}
                className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-emerald-600 font-semibold hover:bg-neutral-50"
              >
                Completed
              </button>
              <button
                onClick={() => handleBulkStatus('Ready for Delivery')}
                className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-indigo-600 font-semibold hover:bg-neutral-50"
              >
                Ready for Delivery
              </button>
              {currentUser.role !== 'User' && (
                <button
                  onClick={() => handleBulkStatus('Delivered')}
                  className="px-2.5 py-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-blue-600 font-semibold hover:bg-neutral-50"
                >
                  Delivered
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Master Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#18181B] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 text-[#86868B] dark:text-[#98989D] font-semibold select-none">
              <tr>
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === paginatedProjects.length}
                    onChange={toggleSelectAll}
                    className="rounded text-[#007AFF] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th onClick={() => handleSort('job_id')} className="py-3 px-3 cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center gap-1">
                    <span>Job ID</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th onClick={() => handleSort('job_name')} className="py-3 px-3 cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center gap-1">
                    <span>Job Name</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th onClick={() => handleSort('branch_name')} className="py-3 px-3 cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center gap-1">
                    <span>Branch Name</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th onClick={() => handleSort('box_number')} className="py-3 px-3 cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center gap-1">
                    <span>Archive Location</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th onClick={() => handleSort('total_box')} className="py-3 px-3 text-right cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Box</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th onClick={() => handleSort('total_document')} className="py-3 px-3 text-right cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Doc</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th onClick={() => handleSort('total_sheets')} className="py-3 px-3 text-right cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Sheets</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th onClick={() => handleSort('date_print')} className="py-3 px-3 cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center gap-1">
                    <span>Date Print</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th onClick={() => handleSort('archive_status')} className="py-3 px-3 cursor-pointer hover:text-[#007AFF]">
                  <div className="flex items-center gap-1">
                    <span>Archive Status</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-neutral-400">
                    No projects found matching the filter criteria
                  </td>
                </tr>
              ) : (
                paginatedProjects.map(proj => (
                  <tr
                    key={proj.job_id}
                    onClick={() => onOpenProject(proj)}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(proj.job_id)}
                        onChange={() => toggleSelectOne(proj.job_id)}
                        className="rounded text-[#007AFF] focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#007AFF]">
                      #{proj.job_id}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#1D1D1F] dark:text-[#F5F5F7] max-w-xs truncate">
                      {proj.job_name}
                    </td>
                    <td className="py-2.5 px-3 text-[#86868B] dark:text-[#98989D]">
                      {proj.branch_name}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-mono text-neutral-600 dark:text-neutral-400">
                        Box {proj.box_number} · D{proj.dossier_number} · P{proj.dossier_position}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                      {proj.total_box}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                      {proj.total_document}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">
                      {proj.total_sheets}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-500">
                      {proj.date_print}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded ${
                          proj.archive_status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : proj.archive_status === 'Delivered'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                            : proj.archive_status === 'Missing'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                            : proj.archive_status === 'Ready for Delivery'
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                            : proj.archive_status === 'In Progress'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                            : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {proj.archive_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onPrintLabel(proj)}
                          className="p-1 text-neutral-400 hover:text-[#007AFF] rounded"
                          title="Print Label"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                        {(proj.archive_status === 'Completed' || proj.archive_status === 'Ready for Delivery') && (
                          <button
                            onClick={() => onOpenDelivery(proj)}
                            className="p-1 text-neutral-400 hover:text-blue-600 rounded"
                            title="Deliver"
                          >
                            <Truck className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenProject(proj)}
                          className="p-1 text-neutral-400 hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] rounded"
                          title="Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Strip */}
        <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/40 flex items-center justify-between text-xs text-[#86868B] dark:text-[#98989D]">
          <div>
            Showing <span className="font-mono font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-mono font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{Math.min(currentPage * pageSize, filteredProjects.length)}</span> of{' '}
            <span className="font-mono font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">{filteredProjects.length}</span> projects
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-mono font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-neutral-300 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
