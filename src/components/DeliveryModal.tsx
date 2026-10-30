import React, { useState } from 'react';
import { Truck, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { Project } from '../types';

interface DeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  project?: Project | null;
  boxNumber?: string;
}

export const DeliveryModal: React.FC<DeliveryModalProps> = ({
  isOpen,
  onClose,
  project,
  boxNumber,
}) => {
  const { deliverProject, deliverBox, currentUser } = useArchive();
  const [recipient, setRecipient] = useState('Central Archive Logistics / Courier Dispatch');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!recipient.trim()) {
      setError('Recipient or courier name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    if (project) {
      const res = deliverProject(project.job_id, recipient, notes);
      if (!res.success) {
        setError(res.error || 'Failed to deliver project');
        setIsSubmitting(false);
        return;
      }
    } else if (boxNumber) {
      const res = deliverBox(boxNumber, recipient, notes);
      if (!res.success) {
        setError('Failed to deliver box');
        setIsSubmitting(false);
        return;
      }
    }

    setIsSubmitting(false);
    onClose();
  };

  const isBoxDelivery = !project && Boolean(boxNumber);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 p-6 animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {isBoxDelivery ? `Deliver Box ${boxNumber}` : `Deliver Project #${project?.job_id}`}
              </h3>
              <p className="text-xs text-[#86868B] dark:text-[#98989D]">
                Record physical archive handover & delivery details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          {project && (
            <div className="p-3 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl space-y-1">
              <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                {project.job_name}
              </div>
              <div className="text-neutral-500">
                Location: Box {project.box_number} · Dossier {project.dossier_number} · Position {project.dossier_position}
              </div>
              <div className="text-neutral-500">
                Branch: {project.branch_name} · Sheets: {project.total_sheets}
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Recipient / Courier Agency <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={recipient}
              onChange={e => setRecipient(e.target.value)}
              placeholder="e.g. Courier Representative, Central Archive Officer"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Delivery Notes / Tracking Code
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Waybill #TRK-9821, Handed over with sign-off receipt"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>

          <div className="p-3 bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl flex items-center gap-2 text-[#86868B] dark:text-[#98989D]">
            <CheckCircle2 className="w-4 h-4 text-[#007AFF] shrink-0" />
            <span>
              Authorized Operator: <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">{currentUser.full_name}</strong> ({currentUser.role})
            </span>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] transition-colors shadow-xs"
          >
            {isSubmitting ? 'Recording...' : 'Confirm Delivery'}
          </button>
        </div>
      </div>
    </div>
  );
};
