import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUpDown,
  Box as BoxIcon,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  FolderArchive,
  FolderOpen,
  Lock,
  PackageCheck,
  Printer,
  RotateCcw,
  Search,
  Send,
  ShieldAlert,
  Unlock,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Box, Dossier, Project, ProjectStatus } from '../../types';
import { evaluateBoxClosure, getDossiersForBox } from '../../utils/allocation';
import { StatusBadge } from '../common/Badge';
import { ConfirmModal } from '../common/ConfirmModal';

export const BoxesView: React.FC = () => {
  const {
    boxes,
    projects,
    selectedBoxNumber,
    setSelectedBoxNumber,
    selectedDossierNumber,
    setSelectedDossierNumber,
    setSelectedJobIdForDetail,
    closeBox,
    reopenBox,
    deliverBox,
    currentUser,
    hasPermission,
    setActiveTab,
  } = useApp();

  // Search & Filter state for Boxes list
  const [boxSearch, setBoxSearch] = useState('');
  const [boxStatusFilter, setBoxStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'box_number' | 'completed' | 'progress' | 'status'>('box_number');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Search & Filter state for Projects within selected dossier
  const [projectSearch, setProjectSearch] = useState('');
  const [projectStatusFilter, setProjectStatusFilter] = useState<string>('all');
  const [projectSortField, setProjectSortField] = useState<keyof Project>('job_id');
  const [projectSortOrder, setProjectSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals
  const [closureModalBox, setClosureModalBox] = useState<Box | null>(null);
  const [reopenModalBox, setReopenModalBox] = useState<Box | null>(null);
  const [deliveryModalBox, setDeliveryModalBox] = useState<Box | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Active Box
  const activeBox = boxes.find((b) => b.box_number === selectedBoxNumber);

  // Calculate box dossiers if active
  const activeBoxDossiers = useMemo(() => {
    if (!activeBox) return [];
    return getDossiersForBox(activeBox, projects);
  }, [activeBox, projects]);

  // Selected dossier object
  const activeDossier = useMemo(() => {
    if (!selectedDossierNumber || !activeBoxDossiers.length) return null;
    return activeBoxDossiers.find((d) => d.dossier_number === selectedDossierNumber) || null;
  }, [selectedDossierNumber, activeBoxDossiers]);

  // Filtered & Sorted Boxes
  const filteredBoxes = useMemo(() => {
    return boxes
      .filter((b) => {
        const matchesSearch =
          b.box_number.toLowerCase().includes(boxSearch.toLowerCase()) ||
          `${b.first_project} ${b.last_project}`.includes(boxSearch);
        const matchesStatus = boxStatusFilter === 'all' || b.status === boxStatusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'box_number') {
          cmp = a.box_number.localeCompare(b.box_number);
        } else if (sortField === 'status') {
          cmp = a.status.localeCompare(b.status);
        } else {
          const aProjects = projects.filter((p) => p.box_number === a.box_number);
          const bProjects = projects.filter((p) => p.box_number === b.box_number);
          const aComp = aProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
          const bComp = bProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
          cmp = aComp - bComp;
        }
        return sortOrder === 'asc' ? cmp : -cmp;
      });
  }, [boxes, boxSearch, boxStatusFilter, sortField, sortOrder, projects]);

  // Projects inside active dossier
  const dossierProjects = useMemo(() => {
    if (!activeBox || !selectedDossierNumber) return [];
    return projects
      .filter(
        (p) =>
          p.box_number === activeBox.box_number &&
          p.dossier_number === selectedDossierNumber &&
          (projectStatusFilter === 'all' || p.status === projectStatusFilter) &&
          (projectSearch === '' ||
            String(p.job_id).includes(projectSearch) ||
            p.job_name.toLowerCase().includes(projectSearch.toLowerCase()) ||
            p.branch_name.toLowerCase().includes(projectSearch.toLowerCase()))
      )
      .sort((a, b) => {
        const valA = a[projectSortField] ?? '';
        const valB = b[projectSortField] ?? '';
        let cmp = 0;
        if (typeof valA === 'number' && typeof valB === 'number') {
          cmp = valA - valB;
        } else {
          cmp = String(valA).localeCompare(String(valB));
        }
        return projectSortOrder === 'asc' ? cmp : -cmp;
      });
  }, [activeBox, selectedDossierNumber, projects, projectStatusFilter, projectSearch, projectSortField, projectSortOrder]);

  const handleBoxSort = (field: 'box_number' | 'completed' | 'progress' | 'status') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleProjectSort = (field: keyof Project) => {
    if (projectSortField === field) {
      setProjectSortOrder(projectSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setProjectSortField(field);
      setProjectSortOrder('asc');
    }
  };

  // Evaluate closure for active box
  const closureEval = activeBox ? evaluateBoxClosure(activeBox, projects) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ============================================================== */}
      {/* 1. TOP VIEW: BREADCRUMB OR HEADING */}
      {/* ============================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <button
            onClick={() => {
              setSelectedBoxNumber(null);
              setSelectedDossierNumber(null);
            }}
            className={`hover:text-[#007AFF] transition-colors flex items-center gap-1.5 ${
              !selectedBoxNumber ? 'font-bold text-slate-900 dark:text-white' : ''
            }`}
          >
            <BoxIcon className="w-4 h-4 text-[#007AFF]" />
            <span>All Archive Boxes</span>
          </button>

          {selectedBoxNumber && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <button
                onClick={() => setSelectedDossierNumber(null)}
                className={`hover:text-[#007AFF] transition-colors ${
                  !selectedDossierNumber ? 'font-bold text-slate-900 dark:text-white' : ''
                }`}
              >
                Box {selectedBoxNumber}
              </button>
            </>
          )}

          {selectedDossierNumber && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-bold text-slate-900 dark:text-white">
                Dossier {selectedDossierNumber}
              </span>
            </>
          )}
        </div>

        {selectedBoxNumber && (
          <button
            onClick={() => {
              if (selectedDossierNumber) {
                setSelectedDossierNumber(null);
              } else {
                setSelectedBoxNumber(null);
              }
            }}
            className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#1C1C1E] transition-colors self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to {selectedDossierNumber ? `Box ${selectedBoxNumber}` : 'All Boxes'}</span>
          </button>
        )}
      </div>

      {actionError && (
        <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-xs text-[#FF3B30] flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. LEVEL 1: ALL BOXES TABLE VIEW (Click whole row to open) */}
      {/* ============================================================== */}
      {!selectedBoxNumber && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-[#1C1C1E] p-3 rounded-2xl border border-slate-200/80 dark:border-white/10">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={boxSearch}
                onChange={(e) => setBoxSearch(e.target.value)}
                placeholder="Search box number (e.g. D41)..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-[#007AFF] text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={boxStatusFilter}
                onChange={(e) => setBoxStatusFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              >
                <option value="all">All Box Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Boxes Table */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase tracking-wider">
                    <th
                      onClick={() => handleBoxSort('box_number')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Box Number</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Dossier Count</th>
                    <th className="py-3 px-4">Project Count</th>
                    <th
                      onClick={() => handleBoxSort('completed')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Completed Projects</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-[#FF3B30]">Missing Projects</th>
                    <th className="py-3 px-4">Remaining Projects</th>
                    <th
                      onClick={() => handleBoxSort('progress')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Progress</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleBoxSort('status')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Box Status</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredBoxes.map((box) => {
                    const boxProjs = projects.filter((p) => p.box_number === box.box_number);
                    const completed = boxProjs.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
                    const missing = boxProjs.filter((p) => p.status === 'Missing').length;
                    const remaining = box.capacity - completed;
                    const percent = Math.min(100, Math.round((completed / box.capacity) * 100));

                    return (
                      <tr
                        key={box.box_number}
                        onClick={() => setSelectedBoxNumber(box.box_number)}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] cursor-pointer transition-colors group"
                      >
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-mono font-bold text-xs">
                              {box.box_number}
                            </div>
                            <div>
                              <span>Box {box.box_number}</span>
                              <span className="block text-[11px] text-slate-400 font-mono font-normal">
                                {box.first_project} – {box.last_project}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {box.dossier_count} Dossiers
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 dark:text-white">
                          {boxProjs.length} / {box.capacity}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-[#34C759]">
                          {completed}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold">
                          <span className={missing > 0 ? 'text-[#FF3B30]' : 'text-slate-400'}>
                            {missing}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                          {remaining}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="w-28 space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-mono">
                              <span className="text-slate-500">{percent}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  percent === 100 ? 'bg-[#34C759]' : 'bg-[#007AFF]'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={box.status} />
                        </td>
                        <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedBoxNumber(box.box_number)}
                              className="p-1.5 text-slate-400 hover:text-[#007AFF] hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                              title="Open Box Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setActiveTab('labels');
                              }}
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                              title="Print Labels for this box"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. LEVEL 2: ACTIVE BOX DETAILS & DOSSIERS LIST */}
      {/* ============================================================== */}
      {activeBox && !selectedDossierNumber && (
        <div className="space-y-6">
          {/* Box Header Card */}
          <div className="p-6 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-xl font-mono">
                  {activeBox.box_number}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                      Archive Box {activeBox.box_number}
                    </h2>
                    <StatusBadge status={activeBox.status} />
                    {activeBox.is_override_closed && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 border border-amber-500/20">
                        Override Closed
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-1">
                    Job ID Range: {activeBox.first_project} – {activeBox.last_project} · Capacity: {activeBox.capacity} Projects ({activeBox.dossier_count} Dossiers)
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setActiveTab('labels')}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-white/10"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Generate Labels</span>
                </button>

                {activeBox.status !== 'Closed' && (
                  <button
                    onClick={() => setDeliveryModalBox(activeBox)}
                    disabled={!hasPermission('deliver')}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#5856D6] hover:bg-[#4745B8] text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Deliver Box</span>
                  </button>
                )}

                {activeBox.status === 'Closed' ? (
                  <button
                    onClick={() => setReopenModalBox(activeBox)}
                    disabled={currentUser.role !== 'System Manager'}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                    title={currentUser.role !== 'System Manager' ? 'Only System Manager can reopen' : 'Reopen closed box'}
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reopen Box</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setClosureModalBox(activeBox)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#34C759] hover:bg-[#28A745] text-white flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Close Box</span>
                  </button>
                )}
              </div>
            </div>

            {/* Closure Blockers Notice if any */}
            {closureEval && !closureEval.canClose && activeBox.status !== 'Closed' && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs space-y-1">
                <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Box Closure Currently Blocked:</span>
                </div>
                <ul className="list-disc pl-6 text-amber-900/80 dark:text-amber-300 space-y-0.5">
                  {closureEval.blockingReasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
                <div className="text-[11px] text-amber-700 dark:text-amber-400/80 pt-1">
                  System Managers may perform an authorized closure override with mandatory justification.
                </div>
              </div>
            )}

            {/* Box Progress Bar & Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 text-center text-xs">
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Total Dossiers</span>
                <span className="text-base font-bold text-slate-800 dark:text-white font-mono mt-0.5 block">
                  {activeBox.dossier_count}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Registered Projects</span>
                <span className="text-base font-bold text-slate-800 dark:text-white font-mono mt-0.5 block">
                  {closureEval?.stats.totalRegistered || 0} / {activeBox.capacity}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Completed Projects</span>
                <span className="text-base font-bold text-[#34C759] font-mono mt-0.5 block">
                  {(closureEval?.stats.completed || 0) + (closureEval?.stats.delivered || 0)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Missing Projects</span>
                <span className={`text-base font-bold font-mono mt-0.5 block ${
                  (closureEval?.stats.missing || 0) > 0 ? 'text-[#FF3B30]' : 'text-slate-400'
                }`}>
                  {closureEval?.stats.missing || 0}
                </span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-xl">
                <span className="text-[10px] text-slate-400 uppercase block">Remaining to Complete</span>
                <span className="text-base font-bold text-slate-600 dark:text-slate-300 font-mono mt-0.5 block">
                  {activeBox.capacity - ((closureEval?.stats.completed || 0) + (closureEval?.stats.delivered || 0))}
                </span>
              </div>
            </div>
          </div>

          {/* Dossiers Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderArchive className="w-4 h-4 text-[#007AFF]" />
                <span>Standard Dossiers in Box {activeBox.box_number} (50 Projects Each)</span>
              </h3>
              <span className="text-xs text-slate-400">
                Select a dossier to inspect its project records
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeBoxDossiers.map((dossier) => {
                const dProjects = projects.filter(
                  (p) => p.box_number === activeBox.box_number && p.dossier_number === dossier.dossier_number
                );
                const dCompleted = dProjects.filter((p) => p.status === 'Completed' || p.status === 'Delivered').length;
                const dMissing = dProjects.filter((p) => p.status === 'Missing').length;
                const percent = Math.min(100, Math.round((dCompleted / dossier.capacity) * 100));

                return (
                  <div
                    key={dossier.dossier_number}
                    onClick={() => setSelectedDossierNumber(dossier.dossier_number)}
                    className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 hover:border-[#007AFF] cursor-pointer transition-all hover:shadow-md group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 text-[#007AFF] flex items-center justify-center font-bold text-sm">
                          D{dossier.dossier_number}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-[#007AFF] transition-colors">
                            Dossier {dossier.dossier_number}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono">
                            Positions: {dossier.position_range} (Jobs {dossier.first_project}–{dossier.last_project})
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={dossier.status} />
                    </div>

                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500">
                          {dCompleted} / {dossier.capacity} projects complete
                        </span>
                        <span className="font-bold text-[#007AFF]">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            percent === 100 ? 'bg-[#34C759]' : 'bg-[#007AFF]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-mono">
                        {dProjects.length} registered
                        {dMissing > 0 && <span className="text-[#FF3B30] font-bold"> · {dMissing} Missing</span>}
                      </span>
                      <span className="text-[#007AFF] font-medium flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. LEVEL 3: DOSSIER PROJECTS TABLE VIEW */}
      {/* ============================================================== */}
      {activeBox && selectedDossierNumber && activeDossier && (
        <div className="space-y-4">
          {/* Dossier Header Strip */}
          <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-sm">
                D{selectedDossierNumber}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Box {activeBox.box_number} / Dossier {selectedDossierNumber}</span>
                  <StatusBadge status={activeDossier.status} />
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Positions: {activeDossier.position_range} · Expected Job IDs: {activeDossier.first_project} to {activeDossier.last_project}
                </span>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder="Search Job ID or Name..."
                  className="text-xs pl-8 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <select
                value={projectStatusFilter}
                onChange={(e) => setProjectStatusFilter(e.target.value)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none"
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
          </div>

          {/* Dossier Projects Table (MANDATORY ORDER from Section 5.3:
              1. Job ID
              2. Job Name
              3. Branch Name
              4. Total Box
              5. Total Document
              6. Total Sheets
              7. Date Print
              8. Project Status
              9. Actions
          ) */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase tracking-wider">
                    {/* 1. Job ID */}
                    <th
                      onClick={() => handleProjectSort('job_id')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Job ID</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    {/* 2. Job Name */}
                    <th
                      onClick={() => handleProjectSort('job_name')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Job Name</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    {/* 3. Branch Name */}
                    <th
                      onClick={() => handleProjectSort('branch_name')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Branch Name</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    {/* 4. Total Box */}
                    <th
                      onClick={() => handleProjectSort('total_box')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Total Box</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    {/* 5. Total Document */}
                    <th
                      onClick={() => handleProjectSort('total_document')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Total Document</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    {/* 6. Total Sheets */}
                    <th
                      onClick={() => handleProjectSort('total_sheets')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Total Sheets</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    {/* 7. Date Print */}
                    <th
                      onClick={() => handleProjectSort('date_print')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date Print</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    {/* 8. Project Status */}
                    <th
                      onClick={() => handleProjectSort('status')}
                      className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                    >
                      <div className="flex items-center gap-1">
                        <span>Project Status</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </div>
                    </th>
                    {/* 9. Actions */}
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {dossierProjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No projects found in this dossier matching the filter.
                      </td>
                    </tr>
                  ) : (
                    dossierProjects.map((p) => (
                      <tr
                        key={p.job_id}
                        onClick={() => setSelectedJobIdForDetail(p.job_id)}
                        className="hover:bg-slate-50/80 dark:hover:bg-white/[0.03] cursor-pointer transition-colors"
                      >
                        {/* 1. Job ID */}
                        <td className="py-3 px-4 font-mono font-bold text-[#007AFF]">
                          #{p.job_id}
                        </td>
                        {/* 2. Job Name */}
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                          {p.job_name}
                        </td>
                        {/* 3. Branch Name */}
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                          {p.branch_name}
                        </td>
                        {/* 4. Total Box */}
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {p.total_box}
                        </td>
                        {/* 5. Total Document */}
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {p.total_document}
                        </td>
                        {/* 6. Total Sheets */}
                        <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {p.total_sheets}
                        </td>
                        {/* 7. Date Print */}
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {p.date_print || '—'}
                        </td>
                        {/* 8. Project Status */}
                        <td className="py-3 px-4">
                          <StatusBadge status={p.status} />
                        </td>
                        {/* 9. Actions */}
                        <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedJobIdForDetail(p.job_id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#007AFF]/10 text-[#007AFF] hover:bg-[#007AFF]/20 transition-colors"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CONFIRMATION DIALOGS: CLOSURE, OVERRIDE, REOPEN, DELIVERY */}
      {/* ============================================================== */}

      {/* Box Closure Modal */}
      {closureModalBox && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setClosureModalBox(null)}
          title={`Close Box ${closureModalBox.box_number}`}
          badge={closureEval && !closureEval.canClose ? 'System Manager Override' : 'Normal Closure'}
          description={
            closureEval && !closureEval.canClose
              ? `Box ${closureModalBox.box_number} has incomplete conditions: ${closureEval.blockingReasons.join(
                  ' '
                )}. As a System Manager, you may override these conditions. A detailed reason is strictly required.`
              : `All required dossiers and projects in Box ${closureModalBox.box_number} are verified. Are you ready to seal and mark this box as Closed?`
          }
          warningNote={
            closureEval && !closureEval.canClose
              ? 'Warning: Closing by override does NOT mark incomplete or missing projects as Completed automatically. An audit entry will be permanently logged.'
              : undefined
          }
          requireReason={closureEval ? !closureEval.canClose : false}
          reasonLabel="Manager Closure Override Reason (Required)"
          reasonPlaceholder="e.g. Authorized physical closure despite 2 missing records per directorate protocol #8492..."
          confirmLabel={closureEval && !closureEval.canClose ? 'Override & Close Box' : 'Close Box'}
          onConfirm={(reason) => {
            const isOverride = closureEval ? !closureEval.canClose : false;
            const res = closeBox(closureModalBox.box_number, isOverride, reason);
            if (!res.success && res.error) {
              setActionError(res.error);
            } else {
              setClosureModalBox(null);
            }
          }}
        />
      )}

      {/* Reopen Box Modal */}
      {reopenModalBox && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setReopenModalBox(null)}
          title={`Reopen Box ${reopenModalBox.box_number}`}
          badge="Authorized Reopening"
          description={`Reopening Box ${reopenModalBox.box_number} will transition its status back to In Progress. Please provide the operational justification for auditing.`}
          requireReason={true}
          reasonLabel="Reopen Reason & Justification (Required)"
          reasonPlaceholder="e.g. Additional audit documents received / physical verification requested..."
          confirmLabel="Reopen Box"
          onConfirm={(reason) => {
            const res = reopenBox(reopenModalBox.box_number, reason || '');
            if (!res.success && res.error) {
              setActionError(res.error);
            } else {
              setReopenModalBox(null);
            }
          }}
        />
      )}

      {/* Deliver Box Modal */}
      {deliveryModalBox && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setDeliveryModalBox(null)}
          title={`Deliver Complete Box ${deliveryModalBox.box_number}`}
          description={`This will mark all Completed and Ready for Delivery projects in Box ${deliveryModalBox.box_number} as Delivered and record the delivery audit event.`}
          requireReason={true}
          reasonLabel="Delivery Destination & Recipient (Required)"
          reasonPlaceholder="e.g. Archive Vault 3 — Shelf C / Received by Mr. Hassan..."
          confirmLabel="Deliver Box"
          onConfirm={(recipient) => {
            const res = deliverBox(deliveryModalBox.box_number, recipient);
            if (!res.success && res.error) {
              setActionError(res.error);
            } else {
              setDeliveryModalBox(null);
            }
          }}
        />
      )}
    </div>
  );
};
