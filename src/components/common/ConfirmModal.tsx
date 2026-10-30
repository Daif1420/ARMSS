import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  reasonLabel?: string;
  warningNote?: string;
  badge?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  requireReason = false,
  reasonPlaceholder = 'Please enter a clear explanation for this action...',
  reasonLabel = 'Reason / Justification (Required)',
  warningNote,
  badge,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requireReason && reason.trim().length < 5) {
      setError('Please provide a meaningful reason (at least 5 characters).');
      return;
    }
    setError('');
    onConfirm(reason);
    setReason('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex items-center gap-2.5">
            {isDestructive ? (
              <div className="w-9 h-9 rounded-full bg-[#FF3B30]/10 text-[#FF3B30] flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
            ) : requireReason ? (
              <div className="w-9 h-9 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-[#1D1D1F] dark:text-white leading-tight">
                {title}
              </h3>
              {badge && (
                <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                  {badge}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 py-2 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {description}
          </p>

          {warningNote && (
            <div className="p-3 bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 rounded-xl text-xs text-[#995C00] dark:text-[#FFB340] leading-normal flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#FF9F0A]" />
              <span>{warningNote}</span>
            </div>
          )}

          {requireReason && (
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {reasonLabel}
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError('');
                }}
                rows={3}
                placeholder={reasonPlaceholder}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-black/20 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#007AFF] resize-none"
                autoFocus
              />
              {error && <p className="text-xs text-[#FF3B30]">{error}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 mt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-[#2C2C2E] border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-colors ${
              isDestructive
                ? 'bg-[#FF3B30] hover:bg-[#D70015]'
                : requireReason
                ? 'bg-[#FF9F0A] hover:bg-[#E08B00]'
                : 'bg-[#007AFF] hover:bg-[#0066D6]'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
