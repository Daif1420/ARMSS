import React from 'react';
import { X, Printer } from 'lucide-react';
import { generateBarcodeSVG } from '../utils/barcode';

export interface LabelData {
  type: 'box' | 'dossier' | 'project';
  title: string;
  box_number: string;
  dossier_number?: number;
  project_start?: number;
  project_end?: number;
  project_count?: number;
  job_id?: number;
  branch_name?: string;
  date?: string;
  barcode_value: string;
}

interface LabelPrintPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  labels: LabelData[];
}

export const LabelPrintPreview: React.FC<LabelPrintPreviewProps> = ({
  isOpen,
  onClose,
  labels,
}) => {
  if (!isOpen || labels.length === 0) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs no-print">
      <div
        className="w-full max-w-3xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/40">
          <div>
            <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Thermal Label Print Preview (100 × 50 mm)
            </h3>
            <p className="text-xs text-[#86868B] dark:text-[#98989D]">
              Zebra Printer Compliant · High Resolution Code 128 · {labels.length} {labels.length === 1 ? 'label' : 'labels'} prepared
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Send to Printer</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Labels Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-100 dark:bg-neutral-950 flex flex-col items-center gap-6">
          {labels.map((lbl, idx) => (
            <div
              key={idx}
              className="bg-white text-black border border-neutral-300 shadow-md p-4 flex flex-col justify-between"
              style={{
                width: '378px', // Approximately 100mm at 96 DPI
                height: '189px', // Approximately 50mm at 96 DPI
                fontFamily: 'Inter, system-ui, sans-serif',
                boxSizing: 'border-box',
              }}
            >
              {/* Header inside label */}
              <div className="flex items-start justify-between border-b-2 border-black pb-1">
                <div>
                  <div className="text-[12px] font-black uppercase tracking-wider leading-none">
                    INTERCOM OPERATIONAL ARCHIVE
                  </div>
                  <div className="text-[9px] font-bold text-neutral-800 leading-tight">
                    {lbl.type === 'box'
                      ? 'MASTER ARCHIVE BOX'
                      : lbl.type === 'dossier'
                      ? `DOSSIER #${lbl.dossier_number}`
                      : 'PROJECT DOSSIER UNIT'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-mono font-black leading-none">
                    BOX {lbl.box_number}
                  </div>
                  {lbl.dossier_number && (
                    <div className="text-[10px] font-bold font-mono text-neutral-800 leading-none mt-0.5">
                      D-{lbl.dossier_number}
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Section: Project Range & Counts */}
              <div className="my-auto py-1">
                {lbl.type === 'project' ? (
                  <div>
                    <div className="text-[16px] font-mono font-black">
                      JOB #{lbl.job_id}
                    </div>
                    <div className="text-[10px] font-semibold truncate max-w-[340px]">
                      {lbl.title}
                    </div>
                    <div className="text-[9px] text-neutral-700">
                      Branch: {lbl.branch_name || 'Central'}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline justify-between">
                      <div className="text-[9px] font-bold uppercase text-neutral-700">
                        Project Allocation Range:
                      </div>
                      <div className="text-[9px] font-bold font-mono">
                        Count: {lbl.project_count || 300} Units
                      </div>
                    </div>
                    <div className="text-[18px] font-mono font-black tracking-tight leading-snug">
                      #{lbl.project_start} — #{lbl.project_end}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Section: Code 128 Barcode & Date */}
              <div className="border-t border-black pt-1 flex items-end justify-between gap-2">
                <div className="w-[180px] h-[32px] overflow-hidden">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: generateBarcodeSVG(lbl.barcode_value, 28),
                    }}
                  />
                  <div className="text-[8px] font-mono font-bold text-center tracking-widest leading-none">
                    {lbl.barcode_value}
                  </div>
                </div>
                <div className="text-right text-[8px] font-mono leading-tight">
                  <div>DATE: {lbl.date || new Date().toISOString().split('T')[0]}</div>
                  <div>ZEBRA COMPLIANT 100x50MM</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
