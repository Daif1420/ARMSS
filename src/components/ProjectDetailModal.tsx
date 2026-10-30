import React, { useState } from 'react';
import {
  X,
  FileText,
  MapPin,
  Calendar,
  Layers,
  FileCheck,
  CheckCircle,
  Truck,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { Project, ProjectStatus } from '../types';
import { useArchive } from '../context/ArchiveContext';

interface ProjectDetailModalProps {
  project: Project | null;
  onClose: () => void;
  onOpenDelivery: (p: Project) => void;
  onPrintLabel: (p: Project) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  project,
  onClose,
  onOpenDelivery,
  onPrintLabel,
}) => {
  const { updateProjectStatus, currentUser } = useArchive();
  const [selectedStatus, setSelectedStatus] = useState<ProjectStatus>(
    project?.archive_status || 'Pending'
  );
  const [statusReason, setStatusReason] = useState('');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  if (!project) return null;

  const handleUpdateStatus = () => {
    const res = updateProjectStatus(project.job_id, selectedStatus, statusReason);
    if (!res.success) {
      setStatusFeedback(res.error || 'Failed to update status');
    } else {
      setStatusFeedback('Status updated successfully');
      setTimeout(() => setStatusFeedback(null), 2500);
    }
  };

  const statusColors: Record<ProjectStatus, string> = {
    Completed: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    Delivered: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    'Ready for Delivery': 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800',
    'In Progress': 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    Pending: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
    Missing: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-800',
    'On Hold': 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 dark:bg-[#007AFF]/20 px-2 py-0.5 rounded">
                Job ID #{project.job_id}
              </span>
              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${statusColors[project.archive_status]}`}>
                {project.archive_status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7] leading-tight">
              {project.job_name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-[#86868B] dark:text-[#98989D] mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{project.branch_name}</span>
              <span>·</span>
              <Calendar className="w-3.5 h-3.5" />
              <span>Date Print: {project.date_print}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Archive Placement Hierarchy */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800">
            <h4 className="text-xs font-semibold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider mb-2">
              Archive Allocation Location
            </h4>
            <div className="flex items-center gap-2 text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
              <span className="text-[#007AFF]">Intercom Physical Archive</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-bold">Box {project.box_number}</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              <span className="font-bold">Dossier {project.dossier_number}</span>
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              <span>Dossier Position #{project.dossier_position}</span>
              <span className="text-neutral-400">(Box Slot #{project.position})</span>
            </div>
          </div>

          {/* Source Metrics Grid */}
          <div>
            <h4 className="text-xs font-semibold text-[#86868B] dark:text-[#98989D] uppercase tracking-wider mb-2.5">
              Source Project Data
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800">
                <div className="text-xs text-[#86868B] dark:text-[#98989D] flex items-center gap-1.5 mb-1">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Total Box</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {project.total_box}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800">
                <div className="text-xs text-[#86868B] dark:text-[#98989D] flex items-center gap-1.5 mb-1">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Total Document</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {project.total_document}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800">
                <div className="text-xs text-[#86868B] dark:text-[#98989D] flex items-center gap-1.5 mb-1">
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Total Sheets</span>
                </div>
                <div className="text-lg font-bold font-mono text-[#1D1D1F] dark:text-[#F5F5F7] tabular-nums">
                  {project.total_sheets}
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Details (if delivered) */}
          {project.archive_status === 'Delivered' && (
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-xs space-y-1.5">
              <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#007AFF]" />
                <span>Delivery Handover Verified</span>
              </div>
              <div className="text-neutral-600 dark:text-neutral-300">
                Recipient: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{project.delivery_recipient || 'N/A'}</strong>
              </div>
              <div className="text-neutral-600 dark:text-neutral-300">
                Dispatched By: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{project.delivery_by || 'N/A'}</strong>
              </div>
              <div className="text-neutral-600 dark:text-neutral-300">
                Timestamp: <span className="font-mono">{project.delivery_date || 'N/A'}</span>
              </div>
              {project.delivery_notes && (
                <div className="text-neutral-600 dark:text-neutral-300 italic pt-1">
                  Note: &ldquo;{project.delivery_notes}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Status Controls */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/30 dark:bg-neutral-900/20 space-y-3">
            <h4 className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Update Archive Status
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-[#86868B] dark:text-[#98989D] mb-1">
                  Select Target Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={e => setSelectedStatus(e.target.value as ProjectStatus)}
                  className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Missing">Missing</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Ready for Delivery">Ready for Delivery</option>
                  {currentUser.role !== 'User' && <option value="Delivered">Delivered</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#86868B] dark:text-[#98989D] mb-1">
                  Reason / Operational Note
                </label>
                <input
                  type="text"
                  value={statusReason}
                  onChange={e => setStatusReason(e.target.value)}
                  placeholder="e.g. Verified folder physical sheets"
                  className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>
            </div>

            {statusFeedback && (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{statusFeedback}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-[#86868B] dark:text-[#98989D]">
                Logged by {currentUser.full_name} ({currentUser.role})
              </span>
              <button
                onClick={handleUpdateStatus}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] transition-colors shadow-xs"
              >
                Apply Status Change
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 px-6 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPrintLabel(project)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>Print Label</span>
            </button>
            {(project.archive_status === 'Completed' || project.archive_status === 'Ready for Delivery') && (
              <button
                onClick={() => {
                  onClose();
                  onOpenDelivery(project);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Deliver Project</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
