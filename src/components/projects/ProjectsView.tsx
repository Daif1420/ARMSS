import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  MapPin,
  Package,
  Plus,
  Search,
  Send,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Project, ProjectStatus } from '../../types';
import { exportToXlsx } from '../../utils/excelParser';
import { StatusBadge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';

export const ProjectsView: React.FC = () => {
  const {
    projects,
    boxes,
    setSelectedJobIdForDetail,
    projectFilterState,
    setProjectFilterState,
    batchDeliverProjects,
    hasPermission,
    currentUser,
  } = useApp();

  // Filters
  const [search, setSearch] = useState(projectFilterState.search || '');
  const [selectedBox, setSelectedBox] = useState<string>(projectFilterState.box || 'all');
  const [selectedDossier, setSelectedDossier] = useState<string>(
    projectFilterState.dossier ? String(projectFilterState.dossier) : 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<string>(projectFilterState.status || 'all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Sorting
  const [sortField, setSortField] = useState<keyof Project>('job_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Selection for bulk actions
  const [selectedJobIds, setSelectedJobIds] = useState<Set<number>>(new Set());
  const [isBulkDeliverModalOpen, setIsBulkDeliverModalOpen] = useState(false);

  // Column visibility
  const [showColumnsModal, setShowColumnsModal] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    job_id: true,
    job_name: true,
    branch_name: true,
    allocation: true,
    total_box: true,
    total_document: true,
    total_sheets: true,
    date_print: true,
    status: true,
    actions: true,
  });

  // Unique branches
  const branches = useMemo(() => {
    return Array.from(new Set(projects.map((p) => p.branch_name))).filter(Boolean);
  }, [projects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter((p) => {
        const matchesSearch =
          search === '' ||
          String(p.job_id).includes(search) ||
          p.job_name.toLowerCase().includes(search.toLowerCase()) ||
          p.branch_name.toLowerCase().includes(search.toLowerCase());

        const matchesBox = selectedBox === 'all' || p.box_number === selectedBox;
        const matchesDossier = selectedDossier === 'all' || String(p.dossier_number) === selectedDossier;
        const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;
        const matchesBranch = selectedBranch === 'all' || p.branch_name === selectedBranch;

        return matchesSearch && matchesBox && matchesDossier && matchesStatus && matchesBranch;
      })
      .sort((a, b) => {
        const valA = a[sortField] ?? '';
        const valB = b[sortField] ?? '';
        let cmp = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          cmp = valA - valB;
        } else {
          cmp = String(valA).localeCompare(String(valB));
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [projects, search, selectedBox, selectedDossier, selectedStatus, selectedBranch, sortField, sortOrder]);

  // Paginated Projects
  const totalPages = Math.ceil(filteredProjects.length / pageSize) || 1;
  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  const handleSort = (field: keyof Project) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAllOnPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const next = new Set(selectedJobIds);
      paginatedProjects.forEach((p) => next.add(p.job_id));
      setSelectedJobIds(next);
    } else {
      const next = new Set(selectedJobIds);
      paginatedProjects.forEach((p) => next.delete(p.job_id));
      setSelectedJobIds(next);
    }
  };

  const toggleSelectOne = (jobId: number) => {
    const next = new Set(selectedJobIds);
    if (next.has(jobId)) {
      next.delete(jobId);
    } else {
      next.add(jobId);
    }
    setSelectedJobIds(next);
  };

  const handleExportFiltered = () => {
    const exportData = filteredProjects.map((p) => ({
      'Job ID': p.job_id,
      'Job Name': p.job_name,
      'Branch Name': p.branch_name,
      'Box Number': p.box_number,
      'Dossier Number': p.dossier_number,
      'Archive Position': p.archive_position,
      'Total Box': p.total_box,
      'Total Document': p.total_document,
      'Total Sheets': p.total_sheets,
      'Date Print': p.date_print,
      'Archive Status': p.status,
      'Delivered At': p.delivery_info?.delivered_at || '',
      'Delivered By': p.delivery_info?.delivered_by || '',
    }));
    exportToXlsx(exportData, `ARMS_Projects_Export_${new Date().toISOString().split('T')[0]}`);
  };

  const resetFilters = () => {
    setSearch('');
    setSelectedBox('all');
    setSelectedDossier('all');
    setSelectedStatus('all');
    setSelectedBranch('all');
    setProjectFilterState({});
    setPage(1);
  };

  const isAllPageSelected =
    paginatedProjects.length > 0 &&
    paginatedProjects.every((p) => selectedJobIds.has(p.job_id));

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Projects Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, sort, and manage all operational reports and their physical archive allocations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Column Visibility */}
          <button
            onClick={() => setShowColumnsModal(!showColumnsModal)}
            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Columns</span>
          </button>

          {/* Export Filtered */}
          <button
            onClick={handleExportFiltered}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-white/5 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-white/10 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export XLSX ({filteredProjects.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search Job ID, Name, Branch..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>

          {/* Box filter */}
          <div>
            <select
              value={selectedBox}
              onChange={(e) => {
                setSelectedBox(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="all">All Boxes</option>
              {boxes.map((b) => (
                <option key={b.box_number} value={b.box_number}>
                  Box {b.box_number} ({b.first_project}–{b.last_project})
                </option>
              ))}
            </select>
          </div>

          {/* Status filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Delivered">Delivered</option>
              <option value="Ready for Delivery">Ready for Delivery</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending">Pending</option>
              <option value="Missing">Missing</option>
              <option value="On Hold">On Hold</option>
            </select>
          </div>

          {/* Branch filter */}
          <div>
            <select
              value={selectedBranch}
              onChange={(e) => {
                setSelectedBranch(e.target.value);
                setPage(1);
              }}
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
        </div>

        {/* Active filter tags & count */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="text-slate-500 font-mono">
            Showing <strong className="text-slate-900 dark:text-white">{filteredProjects.length}</strong> matching projects
          </div>
          {(search || selectedBox !== 'all' || selectedStatus !== 'all' || selectedBranch !== 'all') && (
            <button
              onClick={resetFilters}
              className="text-[#FF3B30] hover:underline text-xs flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar if items selected */}
      {selectedJobIds.size > 0 && (
        <div className="p-3 bg-[#007AFF]/10 border border-[#007AFF]/20 rounded-2xl flex items-center justify-between animate-in fade-in duration-150">
          <div className="text-xs font-semibold text-[#007AFF] flex items-center gap-2">
            <span>{selectedJobIds.size} project(s) selected</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBulkDeliverModalOpen(true)}
              disabled={!hasPermission('deliver')}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#5856D6] hover:bg-[#4745B8] text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Batch Deliver Selected</span>
            </button>
            <button
              onClick={() => setSelectedJobIds(new Set())}
              className="px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleSelectAllOnPage}
                    className="rounded text-[#007AFF] focus:ring-[#007AFF]"
                  />
                </th>
                {visibleColumns.job_id && (
                  <th
                    onClick={() => handleSort('job_id')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Job ID</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.job_name && (
                  <th
                    onClick={() => handleSort('job_name')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Job Name</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.branch_name && (
                  <th
                    onClick={() => handleSort('branch_name')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Branch</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.allocation && (
                  <th className="py-3 px-4">Archive Position</th>
                )}
                {visibleColumns.total_box && (
                  <th
                    onClick={() => handleSort('total_box')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Total Box</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.total_document && (
                  <th
                    onClick={() => handleSort('total_document')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Total Doc</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.total_sheets && (
                  <th
                    onClick={() => handleSort('total_sheets')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Total Sheets</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.date_print && (
                  <th
                    onClick={() => handleSort('date_print')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Date Print</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.status && (
                  <th
                    onClick={() => handleSort('status')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                  >
                    <div className="flex items-center gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 opacity-60" />
                    </div>
                  </th>
                )}
                {visibleColumns.actions && (
                  <th className="py-3 px-4 text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {paginatedProjects.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No projects found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedProjects.map((p) => {
                  const isSelected = selectedJobIds.has(p.job_id);
                  return (
                    <tr
                      key={p.job_id}
                      onClick={() => setSelectedJobIdForDetail(p.job_id)}
                      className={`hover:bg-slate-50/80 dark:hover:bg-white/[0.03] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#007AFF]/5 dark:bg-[#007AFF]/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectOne(p.job_id)}
                          className="rounded text-[#007AFF] focus:ring-[#007AFF]"
                        />
                      </td>

                      {visibleColumns.job_id && (
                        <td className="py-3.5 px-4 font-mono font-bold text-[#007AFF]">
                          #{p.job_id}
                        </td>
                      )}

                      {visibleColumns.job_name && (
                        <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                          {p.job_name}
                        </td>
                      )}

                      {visibleColumns.branch_name && (
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                          {p.branch_name}
                        </td>
                      )}

                      {visibleColumns.allocation && (
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {p.box_number}
                          </span>{' '}
                          / D{p.dossier_number} · #{p.archive_position}
                        </td>
                      )}

                      {visibleColumns.total_box && (
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {p.total_box}
                        </td>
                      )}

                      {visibleColumns.total_document && (
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {p.total_document}
                        </td>
                      )}

                      {visibleColumns.total_sheets && (
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {p.total_sheets}
                        </td>
                      )}

                      {visibleColumns.date_print && (
                        <td className="py-3.5 px-4 font-mono text-slate-500">
                          {p.date_print || '—'}
                        </td>
                      )}

                      {visibleColumns.status && (
                        <td className="py-3.5 px-4">
                          <StatusBadge status={p.status} />
                        </td>
                      )}

                      {visibleColumns.actions && (
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedJobIdForDetail(p.job_id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/75 dark:bg-white/[0.02] border-t border-slate-200/80 dark:border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-500 font-mono">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>
              Page {page} of {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Deliver Modal */}
      {isBulkDeliverModalOpen && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setIsBulkDeliverModalOpen(false)}
          title={`Deliver ${selectedJobIds.size} Selected Projects`}
          badge="Batch Handover"
          description={`You are about to mark ${selectedJobIds.size} project(s) as Delivered in the physical archive. Please specify the recipient or archive destination.`}
          requireReason={true}
          reasonLabel="Delivery Destination / Recipient Name (Required)"
          reasonPlaceholder="e.g. Received by Mr. Kareem (Main Archive Storage) / Protocol #391..."
          confirmLabel="Execute Batch Delivery"
          onConfirm={(recipient) => {
            batchDeliverProjects(Array.from(selectedJobIds), recipient);
            setSelectedJobIds(new Set());
            setIsBulkDeliverModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
