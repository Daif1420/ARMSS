import React, { useState } from 'react';
import {
  X,
  Lock,
  Unlock,
  AlertTriangle,
  Folder,
  Layers,
  ChevronRight,
  Printer,
  Truck,
  CheckCircle2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Box, Project } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface BoxDetailModalProps {
  box: Box | null;
  onClose: () => void;
  onSelectProject: (p: Project) => void;
  onPrintBoxLabel: (boxNumber: string) => void;
  onDeliverBox: (boxNumber: string) => void;
}

export const BoxDetailModal: React.FC<BoxDetailModalProps> = ({
  box,
  onClose,
  onSelectProject,
  onPrintBoxLabel,
  onDeliverBox,
}) => {
  const { projects, getBoxStats, closeBox, reopenBox, currentUser, settings } = useArchive();
  const [selectedDossier, setSelectedDossier] = useState<number>(1);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [showReopenModal, setShowReopenModal] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);

  if (!box) return null;

  const stats = getBoxStats(box.box_number);
  const boxProjects = projects.filter(p => p.box_number === box.box_number);
  const dossierProjects = boxProjects.filter(p => p.dossier_number === selectedDossier);

  // Sort dossier projects by position ascending
  dossierProjects.sort((a, b) => a.position - b.position);

  const handleStandardClose = () => {
    const res = closeBox(box.box_number);
    if (!res.success) {
      setFeedback({ type: 'error', msg: res.error || 'Cannot close box' });
    } else {
      setFeedback({ type: 'success', msg: `Box ${box.box_number} successfully closed` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleOverrideClose = () => {
    if (!overrideReason.trim()) {
      setFeedback({ type: 'error', msg: 'Mandatory override reason is required' });
      return;
    }
    const res = closeBox(box.box_number, overrideReason, true);
    if (!res.success) {
      setFeedback({ type: 'error', msg: res.error || 'Failed to override closure' });
    } else {
      setShowOverrideModal(false);
      setOverrideReason('');
      setFeedback({ type: 'success', msg: `Box ${box.box_number} closed via System Manager Override` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleReopen = () => {
    if (!reopenReason.trim()) {
      setFeedback({ type: 'error', msg: 'Reason is required to reopen this box' });
      return;
    }
    const res = reopenBox(box.box_number, reopenReason);
    if (!res.success) {
      setFeedback({ type: 'error', msg: res.error || 'Failed to reopen box' });
    } else {
      setShowReopenModal(false);
      setReopenReason('');
      setFeedback({ type: 'success', msg: `Box ${box.box_number} has been reopened` });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-5xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Box Top Header */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="font-mono text-base font-bold text-white bg-[#007AFF] px-3 py-1 rounded-lg">
                  Box {box.box_number}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    box.status === 'Closed'
                      ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                      : box.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                  }`}
                >
                  {box.status}
                  {box.is_override_closed && ' (Override Closed)'}
                </span>
                <span className="text-xs text-[#86868B] dark:text-[#98989D]">
                  Range: #{box.start_project} – #{box.end_project} ({box.capacity} capacity)
                </span>
              </div>
              <p className="text-xs text-[#86868B] dark:text-[#98989D]">
                Intercom Project Operational Reports Archive Box
              </p>
            </div>

            {/* Quick Action Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPrintBoxLabel(box.box_number)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition-colors"
              >
                <Printer className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>Box Label</span>
              </button>

              {box.status !== 'Closed' ? (
                <>
                  <button
                    onClick={handleStandardClose}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-xs ${
                      stats.can_close
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 hover:bg-neutral-300'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Close Box</span>
                  </button>

                  {!stats.can_close && currentUser.role === 'System Manager' && (
                    <button
                      onClick={() => setShowOverrideModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 hover:bg-amber-200 transition-colors border border-amber-300/60"
                      title="System Manager manual override closure"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Manager Override</span>
                    </button>
                  )}
                </>
              ) : (
                currentUser.role === 'System Manager' && (
                  <button
                    onClick={() => setShowReopenModal(true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] transition-colors shadow-xs"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reopen Box</span>
                  </button>
                )
              )}

              <button
                onClick={() => onDeliverBox(box.box_number)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 hover:bg-blue-100 transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Deliver Completed</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 ml-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Feedback message */}
          {feedback && (
            <div
              className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
                feedback.type === 'error'
                  ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200'
              }`}
            >
              {feedback.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
              <span>{feedback.msg}</span>
            </div>
          )}

          {/* Blocking Reasons Callout if incomplete */}
          {box.status !== 'Closed' && !stats.can_close && (
            <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-200 mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Box Closure Blocked Until Requirements Met:</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-amber-800 dark:text-amber-300 space-y-0.5">
                {stats.blocking_reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Box Progress & Key Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mt-4 pt-3 border-t border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="text-[11px] text-[#86868B] dark:text-[#98989D]">Total Projects</div>
              <div className="text-sm font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                {stats.total_projects} / {box.capacity}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#86868B] dark:text-[#98989D]">Completed</div>
              <div className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {stats.completed_projects}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#86868B] dark:text-[#98989D]">Delivered</div>
              <div className="text-sm font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {stats.delivered_projects}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#86868B] dark:text-[#98989D]">Missing</div>
              <div className="text-sm font-bold font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                {stats.missing_projects}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#86868B] dark:text-[#98989D]">Remaining</div>
              <div className="text-sm font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                {stats.remaining_projects}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-[#86868B] dark:text-[#98989D]">Progress ({stats.progress_pct}%)</div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden mt-1.5">
                <div
                  className="bg-[#007AFF] h-full rounded-full transition-all duration-300"
                  style={{ width: `${stats.progress_pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dossiers Navigation Tabs */}
        <div className="px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/60 flex items-center gap-2 overflow-x-auto shrink-0">
          <span className="text-xs font-bold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider mr-2 shrink-0">
            Dossiers (1–{box.dossier_count}):
          </span>
          {Array.from({ length: box.dossier_count }, (_, i) => i + 1).map(dNum => {
            const dProjects = boxProjects.filter(p => p.dossier_number === dNum);
            const dCompleted = dProjects.filter(p => p.archive_status === 'Completed' || p.archive_status === 'Delivered').length;
            const dMissing = dProjects.filter(p => p.archive_status === 'Missing').length;
            const isSelected = selectedDossier === dNum;
            const dStart = box.start_project + (dNum - 1) * settings.projects_per_dossier;
            const dEnd = dStart + settings.projects_per_dossier - 1;

            return (
              <button
                key={dNum}
                onClick={() => setSelectedDossier(dNum)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-white dark:bg-neutral-800 text-[#007AFF] shadow-sm border border-[#007AFF]/20'
                    : 'text-[#1D1D1F] dark:text-[#F5F5F7]/70 hover:bg-white/60 dark:hover:bg-neutral-800/50'
                }`}
              >
                <Folder className={`w-3.5 h-3.5 ${isSelected ? 'text-[#007AFF]' : 'text-neutral-400'}`} />
                <span>Dossier {dNum}</span>
                <span className="text-[10px] text-neutral-400">({dStart}–{dEnd})</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-700/60 text-neutral-600 dark:text-neutral-300">
                  {dCompleted}/{dProjects.length}
                </span>
                {dMissing > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" title={`${dMissing} missing`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Dossier Table View */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Dossier {selectedDossier} Projects ({dossierProjects.length} allocated)
              </h3>
              <span className="text-xs text-[#86868B] dark:text-[#98989D]">
                · Positions { (selectedDossier - 1) * 50 + 1 }–{ selectedDossier * 50 }
              </span>
            </div>
            <span className="text-xs text-neutral-500">
              Click any project row to view operational report details
            </span>
          </div>

          {/* Table with columns in EXACT specified order:
              1. Job ID
              2. Job Name
              3. Branch Name
              4. Total Box
              5. Total Document
              6. Total Sheets
              7. Date Print
              8. Project Status
              9. Actions
          */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-white dark:bg-[#18181B]">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 text-[#86868B] dark:text-[#98989D] font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Job ID</th>
                  <th className="py-2.5 px-3">Job Name</th>
                  <th className="py-2.5 px-3">Branch Name</th>
                  <th className="py-2.5 px-3 text-right">Total Box</th>
                  <th className="py-2.5 px-3 text-right">Total Document</th>
                  <th className="py-2.5 px-3 text-right">Total Sheets</th>
                  <th className="py-2.5 px-3">Date Print</th>
                  <th className="py-2.5 px-3">Project Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {dossierProjects.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-neutral-400">
                      No projects currently allocated in Dossier {selectedDossier}
                    </td>
                  </tr>
                ) : (
                  dossierProjects.map(proj => (
                    <tr
                      key={proj.job_id}
                      onClick={() => onSelectProject(proj)}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors group"
                    >
                      <td className="py-2 px-3 font-mono font-bold text-[#007AFF]">
                        #{proj.job_id}
                      </td>
                      <td className="py-2 px-3 font-medium text-[#1D1D1F] dark:text-[#F5F5F7] max-w-xs truncate">
                        {proj.job_name}
                      </td>
                      <td className="py-2 px-3 text-[#86868B] dark:text-[#98989D]">
                        {proj.branch_name}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                        {proj.total_box}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                        {proj.total_document}
                      </td>
                      <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400 font-medium">
                        {proj.total_sheets}
                      </td>
                      <td className="py-2 px-3 font-mono text-neutral-500">
                        {proj.date_print}
                      </td>
                      <td className="py-2 px-3">
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
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onSelectProject(proj);
                          }}
                          className="p-1 text-neutral-400 hover:text-[#007AFF] rounded transition-colors"
                          title="Open project details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Manager Override Reason Modal */}
        {showOverrideModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm mb-2">
                <AlertTriangle className="w-5 h-5" />
                <span>System Manager Closure Override</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-3">
                You are closing <strong>Box {box.box_number}</strong> with incomplete projects. Incomplete projects will <strong>NOT</strong> be marked Completed automatically. A mandatory reason is logged to the central Audit Logs.
              </p>
              <textarea
                rows={3}
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Enter mandatory operational reason for override..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-amber-500 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleOverrideClose}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs"
                >
                  Confirm Override Closure
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reopen Box Modal */}
        {showReopenModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-2xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800">
              <div className="flex items-center gap-2 text-[#007AFF] font-bold text-sm mb-2">
                <Unlock className="w-5 h-5" />
                <span>Reopen Box {box.box_number}</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-3">
                Reopening this closed box allows operators to resume processing and modifying projects. A mandatory audit log entry will be recorded.
              </p>
              <textarea
                rows={3}
                value={reopenReason}
                onChange={e => setReopenReason(e.target.value)}
                placeholder="Enter reason for reopening box..."
                className="w-full px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF] mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReopenModal(false)}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReopen}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] rounded-lg shadow-xs"
                >
                  Confirm Reopen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
