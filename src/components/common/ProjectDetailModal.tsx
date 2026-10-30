import React, { useState } from 'react';
import {
  Archive,
  ArrowRight,
  Barcode,
  Calendar,
  CheckCircle,
  Clock,
  FileSpreadsheet,
  FileText,
  MapPin,
  PackageCheck,
  Send,
  ShieldAlert,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ProjectStatus } from '../../types';
import { generateBarcodeSvg } from '../../utils/labelGenerator';
import { StatusBadge } from './Badge';

export const ProjectDetailModal: React.FC = () => {
  const {
    selectedJobIdForDetail,
    setSelectedJobIdForDetail,
    projects,
    updateProjectStatus,
    deliverProject,
    currentUser,
    hasPermission,
    auditLogs,
  } = useApp();

  const [deliveryRecipient, setDeliveryRecipient] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [isDelivering, setIsDelivering] = useState(false);
  const [statusReason, setStatusReason] = useState('');
  const [statusError, setStatusError] = useState('');
  const [selectedNewStatus, setSelectedNewStatus] = useState<ProjectStatus | null>(null);

  if (!selectedJobIdForDetail) return null;

  const project = projects.find((p) => p.job_id === selectedJobIdForDetail);
  if (!project) return null;

  const handleStatusChange = (newStatus: ProjectStatus) => {
    if (newStatus === 'Missing' || newStatus === 'On Hold') {
      setSelectedNewStatus(newStatus);
      return;
    }
    const res = updateProjectStatus(project.job_id, newStatus);
    if (!res.success && res.error) {
      setStatusError(res.error);
    }
  };

  const handleConfirmStatusWithReason = () => {
    if (!selectedNewStatus) return;
    if (!statusReason.trim()) {
      setStatusError('Please provide a reason for setting this status.');
      return;
    }
    updateProjectStatus(project.job_id, selectedNewStatus, statusReason);
    setSelectedNewStatus(null);
    setStatusReason('');
    setStatusError('');
  };

  const handleDeliver = () => {
    const res = deliverProject(project.job_id, deliveryRecipient, deliveryNotes);
    if (res.success) {
      setIsDelivering(false);
      setDeliveryRecipient('');
      setDeliveryNotes('');
    } else if (res.error) {
      setStatusError(res.error);
    }
  };

  // Find audit logs for this project
  const projectLogs = auditLogs.filter(
    (l) => l.entity_type === 'project' && l.entity_id === String(project.job_id)
  );

  const barcodeSvg = generateBarcodeSvg(String(project.job_id), 36);

  const statuses: ProjectStatus[] = [
    'Pending',
    'In Progress',
    'Completed',
    'Missing',
    'On Hold',
    'Ready for Delivery',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform transition-all max-h-[90vh] flex flex-col"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-mono font-bold text-sm">
              #{project.job_id}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                  Job ID: {project.job_id}
                </h3>
                <StatusBadge status={project.status} />
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Physical Archive Assignment: Box {project.box_number} · Dossier {project.dossier_number} · Position #{project.archive_position}
              </p>
            </div>
          </div>
          <button
            onClick={() => setSelectedJobIdForDetail(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1">
          {/* Barcode & Archive Location hierarchy */}
          <div className="p-3.5 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Standard Archive Hierarchy
              </span>
              <div className="flex items-center gap-1.5 text-xs font-mono text-slate-700 dark:text-slate-300">
                <span className="font-semibold">Archive</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="px-1.5 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF] font-bold">
                  Box {project.box_number}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="font-semibold">Dossier {project.dossier_number}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <span className="text-slate-900 dark:text-white font-bold">
                  Slot #{project.archive_position}
                </span>
              </div>
            </div>

            {/* Barcode representation */}
            <div className="w-44 h-10 bg-white p-1 rounded border border-slate-200 flex items-center justify-center">
              <div
                dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                className="w-full h-full flex items-center justify-center"
              />
            </div>
          </div>

          {/* Project Details Grid */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Source Project Specification
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Job Name</span>
                <span className="text-slate-900 dark:text-white font-medium text-sm leading-snug block">
                  {project.job_name}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Branch Name</span>
                <span className="text-slate-900 dark:text-white font-semibold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#007AFF]" />
                  {project.branch_name}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Date Print (Source Delivery)</span>
                <span className="text-slate-900 dark:text-white font-mono font-medium flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  {project.date_print || 'N/A'}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl">
                <span className="text-slate-400 block mb-0.5">Source Project Volumes</span>
                <div className="flex items-center gap-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                  <span>{project.total_box} Boxes</span>
                  <span>·</span>
                  <span>{project.total_document} Docs</span>
                  <span>·</span>
                  <span>{project.total_sheets} Sheets</span>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Information if delivered */}
          {project.status === 'Delivered' && project.delivery_info && (
            <div className="p-4 bg-[#5856D6]/5 border border-[#5856D6]/20 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#5856D6] dark:text-[#5E5CE6] mb-2">
                <PackageCheck className="w-4 h-4" />
                <span>Delivery Handover Confirmation</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-slate-400">Delivered At:</span>{' '}
                  <span className="font-mono">{new Date(project.delivery_info.delivered_at).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400">Delivered By:</span>{' '}
                  <span className="font-semibold">{project.delivery_info.delivered_by}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-slate-400">Recipient:</span>{' '}
                  <span className="font-medium text-slate-900 dark:text-white">{project.delivery_info.recipient}</span>
                </div>
                {project.delivery_info.notes && (
                  <div className="sm:col-span-2 text-slate-500 italic">
                    "{project.delivery_info.notes}"
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Status Controls */}
          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-xl space-y-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Change Project Archive Status
            </span>
            <div className="flex flex-wrap gap-2">
              {statuses.map((st) => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    project.status === st
                      ? 'bg-[#007AFF] text-white border-[#007AFF] shadow-sm'
                      : 'bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-[#007AFF]'
                  }`}
                >
                  {st}
                </button>
              ))}

              {/* Delivery Action Button */}
              {project.status !== 'Delivered' && (
                <button
                  onClick={() => setIsDelivering(true)}
                  disabled={!hasPermission('deliver')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5 transition-colors ${
                    hasPermission('deliver')
                      ? 'bg-[#5856D6] hover:bg-[#4745B8] shadow-sm'
                      : 'bg-slate-300 dark:bg-slate-700 cursor-not-allowed opacity-60'
                  }`}
                  title={!hasPermission('deliver') ? 'Only authorized users can deliver' : 'Deliver Project'}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Deliver Project</span>
                </button>
              )}
            </div>

            {/* Prompt reason modal for Missing or On Hold */}
            {selectedNewStatus && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Reason for marking as {selectedNewStatus} (Required)</span>
                </div>
                <input
                  type="text"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Physical report missing from folder / Awaiting supervisor review..."
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-black/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#FF9F0A]"
                  autoFocus
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setSelectedNewStatus(null);
                      setStatusReason('');
                    }}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmStatusWithReason}
                    className="px-3 py-1 text-xs font-semibold bg-[#FF9F0A] text-white rounded-md hover:bg-[#E08B00]"
                  >
                    Confirm Status
                  </button>
                </div>
              </div>
            )}

            {/* Delivery form dialog inline */}
            {isDelivering && (
              <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 rounded-lg space-y-2">
                <span className="text-xs font-semibold text-[#5856D6] dark:text-[#5E5CE6] block">
                  Project Delivery Confirmation
                </span>
                <input
                  type="text"
                  value={deliveryRecipient}
                  onChange={(e) => setDeliveryRecipient(e.target.value)}
                  placeholder="Recipient Name / Department / Archive Room Shelf (e.g. Archive Vault 2)"
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-black/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5856D6]"
                />
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Optional delivery notes or protocol reference number..."
                  className="w-full text-xs px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-black/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5856D6]"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => setIsDelivering(false)}
                    className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeliver}
                    className="px-3 py-1 text-xs font-semibold bg-[#5856D6] text-white rounded-md hover:bg-[#4745B8]"
                  >
                    Record Delivery
                  </button>
                </div>
              </div>
            )}

            {statusError && (
              <p className="text-xs text-[#FF3B30] mt-1">{statusError}</p>
            )}
          </div>

          {/* Project History from Central Audit Logs */}
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
              Project Audit History ({projectLogs.length})
            </span>
            {projectLogs.length === 0 ? (
              <div className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5">
                No individual audit events recorded yet for this project.
              </div>
            ) : (
              <div className="space-y-2">
                {projectLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {log.actor} ({log.actor_role})
                      </span>
                      <span className="font-mono">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-800 dark:text-slate-200">{log.details}</div>
                    {log.reason && (
                      <div className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                        Reason: {log.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-200 dark:border-white/10 shrink-0">
          <button
            onClick={() => setSelectedJobIdForDetail(null)}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white rounded-lg hover:bg-slate-300 dark:hover:bg-white/20 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
