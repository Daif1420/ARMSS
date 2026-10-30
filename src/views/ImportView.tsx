import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  FileUp,
  Download,
  AlertTriangle,
  History,
  Check,
  X,
  Eye,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { parseExcelWorkbook, generateSampleWorkbook, ParseResult } from '../utils/excel';
import { ImportItemReview } from '../types';

export const ImportView: React.FC = () => {
  const { projects, commitImportBatch, importBatches, currentUser } = useArchive();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [activeCategoryTab, setActiveCategoryTab] = useState<'all' | 'new' | 'changed' | 'duplicate' | 'error' | 'existing'>('all');
  const [reviewItems, setReviewItems] = useState<ImportItemReview[]>([]);
  const [importSuccessMessage, setImportSuccessMessage] = useState<string | null>(null);
  const [viewHistory, setViewHistory] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImportSuccessMessage(null);

    try {
      const res = await parseExcelWorkbook(file, projects);
      setParseResult(res);
      setReviewItems(res.all_items);
      // Auto-switch to changed or error tab if conflicts exist
      if (res.changed_items.length > 0) {
        setActiveCategoryTab('changed');
      } else if (res.error_items.length > 0) {
        setActiveCategoryTab('error');
      } else {
        setActiveCategoryTab('all');
      }
    } catch (err: any) {
      alert(`Error reading Excel workbook: ${err?.message || 'Invalid format'}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;

    // Filter valid items: new + accepted changed items
    const res = commitImportBatch(parseResult.filename, reviewItems);
    setImportSuccessMessage(
      `Import successfully committed! ${res.inserted} new projects added, ${res.updated} changed projects updated with existing statuses preserved.`
    );
    setParseResult(null);
    setReviewItems([]);
  };

  const visibleItems = reviewItems.filter(item => {
    if (activeCategoryTab === 'all') return true;
    return item.category === activeCategoryTab;
  });

  const changedUnresolvedCount = reviewItems.filter(i => i.category === 'changed' && !i.resolved).length;
  const errorCount = reviewItems.filter(i => i.category === 'error').length;
  const canCommit = parseResult && (changedUnresolvedCount === 0 || currentUser.role === 'System Manager');

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#007AFF]" />
            <span>Operational Excel Workbook Import</span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
            Upload <code className="bg-neutral-100 dark:bg-neutral-800 px-1 py-0.5 rounded font-mono">بيانات المشاريع.xlsx</code> to preview validation, categorizations, and conflicts before committing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={generateSampleWorkbook}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors shadow-xs"
            title="Download test Excel workbook matching specifications"
          >
            <Download className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Download Sample Template</span>
          </button>
          <button
            onClick={() => setViewHistory(!viewHistory)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              viewHistory
                ? 'bg-[#007AFF] text-white border-[#007AFF]'
                : 'bg-white dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Batch History ({importBatches.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {importSuccessMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-300 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{importSuccessMessage}</span>
        </div>
      )}

      {/* BATCH HISTORY VIEW */}
      {viewHistory && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <History className="w-4 h-4 text-[#007AFF]" />
              <span>Import Batch History</span>
            </h3>
            <span className="text-xs text-neutral-400">Maintained audit log of all imported workbooks</span>
          </div>

          <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-neutral-50 dark:bg-neutral-900 text-[#86868B] dark:text-[#98989D] border-b border-neutral-200 dark:border-neutral-800 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Batch ID</th>
                  <th className="py-2.5 px-3">Filename</th>
                  <th className="py-2.5 px-3">Import Date</th>
                  <th className="py-2.5 px-3">Imported By</th>
                  <th className="py-2.5 px-3 text-right">Total Rows</th>
                  <th className="py-2.5 px-3 text-right">New</th>
                  <th className="py-2.5 px-3 text-right">Changed</th>
                  <th className="py-2.5 px-3 text-right">Duplicates</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                {importBatches.map(b => (
                  <tr key={b.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-2 px-3 font-mono font-bold text-[#007AFF]">{b.id}</td>
                    <td className="py-2 px-3 font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">{b.filename}</td>
                    <td className="py-2 px-3 font-mono text-neutral-500">{b.imported_at}</td>
                    <td className="py-2 px-3 text-neutral-600 dark:text-neutral-300">{b.imported_by}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums">{b.total_rows}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-emerald-600 font-bold">{b.new_count}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-amber-600 font-bold">{b.changed_count}</td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums text-neutral-400">{b.duplicate_count}</td>
                    <td className="py-2 px-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DROPZONE / FILE SELECTOR */}
      {!parseResult && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-10 border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-[#007AFF] dark:hover:border-[#007AFF] rounded-3xl bg-white dark:bg-[#1C1C1E] cursor-pointer flex flex-col items-center justify-center text-center transition-all group shadow-xs"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileSpreadsheet className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
            Choose or Drop Operational Workbook
          </h3>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] max-w-md">
            Reads worksheet <code className="font-mono text-[#007AFF]">البيانات (2)</code> or <code className="font-mono text-[#007AFF]">بيانات المشاريع</code>. Validates Job ID, Job Name, Branch Name, Total Box, Total Document, Total Sheets, and Date Delivery.
          </p>
          <div className="mt-4 px-4 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-xl text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] group-hover:bg-[#007AFF] group-hover:text-white transition-colors">
            {isProcessing ? 'Analyzing Excel...' : 'Select File (.xlsx / .xls)'}
          </div>
        </div>
      )}

      {/* PREVIEW & CONFLICT REVIEW AREA */}
      {parseResult && (
        <div className="space-y-5 animate-in fade-in">
          {/* Summary Strip */}
          <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-neutral-200/80 dark:border-neutral-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-[#007AFF] uppercase tracking-wider">
                    Upload Preview & Verification
                  </span>
                  <span className="text-neutral-400">·</span>
                  <span className="text-xs text-neutral-500 font-mono">{parseResult.filename}</span>
                </div>
                <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {parseResult.total_rows} Total Rows Analyzed
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setParseResult(null);
                    setReviewItems([]);
                  }}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!canCommit}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-xs ${
                    canCommit
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-neutral-300 dark:bg-neutral-800 cursor-not-allowed text-neutral-500'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm & Commit Import</span>
                </button>
              </div>
            </div>

            {/* KPI Badges for Categories */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setActiveCategoryTab('new')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeCategoryTab === 'new'
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="text-[11px] text-neutral-500">New Projects</div>
                <div className="text-lg font-bold font-mono text-emerald-600 tabular-nums">
                  {parseResult.new_items.length}
                </div>
              </button>

              <button
                onClick={() => setActiveCategoryTab('existing')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeCategoryTab === 'existing'
                    ? 'border-neutral-500 bg-neutral-100 dark:bg-neutral-800'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="text-[11px] text-neutral-500">Existing (Unchanged)</div>
                <div className="text-lg font-bold font-mono text-neutral-600 dark:text-neutral-300 tabular-nums">
                  {parseResult.existing_items.length}
                </div>
              </button>

              <button
                onClick={() => setActiveCategoryTab('changed')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeCategoryTab === 'changed'
                    ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="text-[11px] text-neutral-500">Changed (Review)</div>
                <div className="text-lg font-bold font-mono text-amber-600 tabular-nums">
                  {parseResult.changed_items.length}
                </div>
              </button>

              <button
                onClick={() => setActiveCategoryTab('duplicate')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeCategoryTab === 'duplicate'
                    ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/20'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="text-[11px] text-neutral-500">Duplicate in File</div>
                <div className="text-lg font-bold font-mono text-purple-600 tabular-nums">
                  {parseResult.duplicate_items.length}
                </div>
              </button>

              <button
                onClick={() => setActiveCategoryTab('error')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeCategoryTab === 'error'
                    ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-neutral-200 dark:border-neutral-800'
                }`}
              >
                <div className="text-[11px] text-neutral-500">Validation Errors</div>
                <div className="text-lg font-bold font-mono text-rose-600 tabular-nums">
                  {parseResult.error_items.length}
                </div>
              </button>
            </div>
          </div>

          {/* Conflict Review Warning if changes exist */}
          {parseResult.changed_items.length > 0 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-start gap-3 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Important Re-import Protection:</strong>
                {parseResult.changed_items.length} projects exist in the archive with altered source values. In accordance with the ARMS specification, existing project archive statuses and box/dossier allocations will be preserved and NOT overwritten automatically.
              </div>
            </div>
          )}

          {/* Table Preview */}
          <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#18181B] shadow-xs">
            <div className="p-3 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                Showing {visibleItems.length} records ({activeCategoryTab} filter)
              </span>
              <button
                onClick={() => setActiveCategoryTab('all')}
                className="text-[#007AFF] hover:underline"
              >
                Show All Records
              </button>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 dark:bg-neutral-900/90 sticky top-0 text-[#86868B] dark:text-[#98989D] border-b border-neutral-200 dark:border-neutral-800 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Job ID</th>
                    <th className="py-2.5 px-3">Job Name</th>
                    <th className="py-2.5 px-3">Branch Name</th>
                    <th className="py-2.5 px-3 text-right">Total Box</th>
                    <th className="py-2.5 px-3 text-right">Total Document</th>
                    <th className="py-2.5 px-3 text-right">Total Sheets</th>
                    <th className="py-2.5 px-3">Date Print</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Validation / Diffs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
                  {visibleItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-[#007AFF]">
                        #{item.job_id}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#1D1D1F] dark:text-[#F5F5F7] max-w-xs truncate">
                        {item.job_name}
                      </td>
                      <td className="py-2.5 px-3 text-[#86868B] dark:text-[#98989D]">
                        {item.branch_name}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                        {item.total_box}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                        {item.total_document}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7] font-semibold">
                        {item.total_sheets}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-neutral-500">
                        {item.date_print}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            item.category === 'new'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                              : item.category === 'changed'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                              : item.category === 'duplicate'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400'
                              : item.category === 'error'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                              : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                          }`}
                        >
                          {item.category.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-neutral-500 text-[11px]">
                        {item.diffs && item.diffs.length > 0 ? (
                          <div className="space-y-0.5">
                            {item.diffs.map((d, i) => (
                              <div key={i} className="text-amber-700 dark:text-amber-400 font-mono">
                                {d.field}: {d.old_value} → {d.new_value}
                              </div>
                            ))}
                          </div>
                        ) : item.error_message ? (
                          <span className="text-rose-600 dark:text-rose-400 font-medium">
                            {item.error_message}
                          </span>
                        ) : (
                          <span className="text-neutral-400">Validated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
