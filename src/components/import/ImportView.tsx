import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileWarning,
  HelpCircle,
  History,
  Layers,
  RefreshCw,
  Sliders,
  Upload,
  UploadCloud,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  generateSampleExcelWorkbook,
  parseExcelWorkbook,
  ParseWorkbookResult,
  REQUIRED_COLUMNS,
} from '../../utils/excelParser';

export const ImportView: React.FC = () => {
  const {
    projects,
    settings,
    currentUser,
    commitImportBatch,
    importBatches,
    hasPermission,
    setActiveTab,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseWorkbookResult | null>(null);
  const [commitMessage, setCommitMessage] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);

  // Active review tab in preview: 'all' | 'new' | 'changed' | 'existing' | 'duplicate' | 'error'
  const [activePreviewTab, setActivePreviewTab] = useState<'summary' | 'new' | 'changed' | 'duplicate' | 'error' | 'existing'>('summary');

  // Conflict resolutions map: jobId string -> 'keep_existing' | 'use_incoming' | 'skip'
  const [conflictResolutions, setConflictResolutions] = useState<Map<string, 'use_incoming' | 'keep_existing' | 'skip'>>(
    new Map()
  );

  const handleFile = async (file: File) => {
    setIsProcessing(true);
    setCommitMessage(null);
    setCommitError(null);

    try {
      const buffer = await file.arrayBuffer();
      const batchId = `batch-${Date.now()}`;
      const result = parseExcelWorkbook(
        buffer,
        file.name,
        projects,
        settings.allocation_ranges,
        batchId
      );

      // Initialize conflict resolutions default to 'keep_existing' (as required by spec: do not silently overwrite!)
      const defaultResolutions = new Map<string, 'use_incoming' | 'keep_existing' | 'skip'>();
      result.changedProjects.forEach((cp) => {
        if (cp.job_id) {
          defaultResolutions.set(String(cp.job_id), 'keep_existing');
        }
      });
      setConflictResolutions(defaultResolutions);

      setParseResult(result);
      setActivePreviewTab('summary');
    } catch (err: any) {
      setCommitError(`Failed to parse file: ${err.message || 'Unknown format'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const bytes = generateSampleExcelWorkbook();
    const blob = new Blob([bytes.buffer as ArrayBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'بيانات المشاريع.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLoadDemoFile = () => {
    const bytes = generateSampleExcelWorkbook();
    const batchId = `batch-demo-${Date.now()}`;
    const result = parseExcelWorkbook(
      bytes,
      'بيانات المشاريع_نموذج_عمليات.xlsx',
      projects,
      settings.allocation_ranges,
      batchId
    );

    const defaultResolutions = new Map<string, 'use_incoming' | 'keep_existing' | 'skip'>();
    result.changedProjects.forEach((cp) => {
      if (cp.job_id) defaultResolutions.set(String(cp.job_id), 'keep_existing');
    });
    setConflictResolutions(defaultResolutions);

    setParseResult(result);
    setActivePreviewTab('summary');
  };

  const handleConfirmImport = () => {
    if (!parseResult) return;
    if (!hasPermission('upload_data')) {
      setCommitError('Access denied: You do not have permission to import project data.');
      return;
    }

    const outcome = commitImportBatch(parseResult, conflictResolutions);
    if (outcome.success) {
      setCommitMessage(outcome.message);
      setParseResult(null);
    } else {
      setCommitError('Failed to commit import batch.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Excel Data Import — بيانات المشاريع
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Import, validate, review conflicts, and automatically allocate project reports into physical archive boxes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Download template */}
          <button
            onClick={handleDownloadSample}
            className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-[#007AFF]" />
            <span>Download Sample 'بيانات المشاريع.xlsx'</span>
          </button>
        </div>
      </div>

      {/* Messages */}
      {commitMessage && (
        <div className="p-4 bg-[#34C759]/10 border border-[#34C759]/20 rounded-2xl flex items-center justify-between text-xs text-[#248A3D] dark:text-[#34C759]">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>{commitMessage}</span>
          </div>
          <button
            onClick={() => setActiveTab('projects')}
            className="text-xs font-bold underline ml-4 hover:opacity-80"
          >
            View Projects
          </button>
        </div>
      )}

      {commitError && (
        <div className="p-4 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-2xl flex items-center justify-between text-xs text-[#FF3B30]">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4" />
            <span>{commitError}</span>
          </div>
          <button onClick={() => setCommitError(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Zone (if no active parse result) */}
      {!parseResult && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Dropzone */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#007AFF] bg-[#007AFF]/5'
                  : 'border-slate-300 dark:border-white/10 bg-white dark:bg-[#1C1C1E] hover:border-[#007AFF]/60 hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center mx-auto mb-4">
                <UploadCloud className="w-7 h-7" />
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Upload operational workbook <span className="font-mono text-[#007AFF]">بيانات المشاريع.xlsx</span>
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 leading-relaxed">
                Drag and drop your spreadsheet here, or click to browse. Supports Excel (.xlsx, .xls) and CSV.
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <span className="text-[11px] text-slate-400 font-mono">
                  Standard format with columns: Job ID, Job Name, Branch Name, Total Box, Total Document, Total Sheets, Date Delivery
                </span>
              </div>
            </div>

            {/* Quick Demo Button */}
            <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/10 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-white block">
                  Want to test the import workflow immediately?
                </span>
                <span className="text-[11px] text-slate-500">
                  Loads realistic Intercom operational project data with confirmed ranges D41 & D42.
                </span>
              </div>
              <button
                onClick={handleLoadDemoFile}
                disabled={isProcessing}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[#007AFF] text-white hover:bg-[#0066D6] transition-colors shadow-sm shrink-0"
              >
                {isProcessing ? 'Processing...' : 'Load Sample Workbook'}
              </button>
            </div>
          </div>

          {/* Side Info: Field Mapping & Re-import Rules */}
          <div className="space-y-4">
            <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-white">
                <FileCheck className="w-4 h-4 text-[#007AFF]" />
                <span>Required Field Mapping</span>
              </div>
              <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5 font-mono text-[11px]">
                  <span className="text-slate-400">Job ID</span>
                  <span className="font-semibold text-[#007AFF]">job_id (Primary)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5 font-mono text-[11px]">
                  <span className="text-slate-400">Job Name</span>
                  <span className="font-semibold">job_name</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5 font-mono text-[11px]">
                  <span className="text-slate-400">Branch Name</span>
                  <span className="font-semibold">branch_name</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5 font-mono text-[11px]">
                  <span className="text-slate-400">Total Box</span>
                  <span className="font-semibold">total_box</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5 font-mono text-[11px]">
                  <span className="text-slate-400">Total Document</span>
                  <span className="font-semibold">total_document</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-white/5 font-mono text-[11px]">
                  <span className="text-slate-400">Total Sheets</span>
                  <span className="font-semibold">total_sheets</span>
                </div>
                <div className="flex justify-between py-1 font-mono text-[11px]">
                  <span className="text-slate-400">Date Delivery</span>
                  <span className="font-semibold text-[#34C759]">date_print (Mapped)</span>
                </div>
              </div>
            </div>

            <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-white block">
                Re-Import Guardrails (§3)
              </span>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
                <li>A repeated Job ID will never create a duplicate record.</li>
                <li>Unchanged records are retained as Existing.</li>
                <li>Changed records are flagged for your review before committing.</li>
                <li>Archive box/dossier allocation is never silently shifted.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PREVIEW & CONFLICT REVIEW STAGE */}
      {/* ============================================================== */}
      {parseResult && (
        <div className="space-y-6">
          {/* Summary Banner */}
          <div className="p-6 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-[#007AFF]/10 text-[#007AFF]">
                    Pre-Commit Validation Preview
                  </span>
                  <span className="text-xs font-mono text-slate-500">{parseResult.filename}</span>
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                  Validated {parseResult.totalRows} Rows from Workbook
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setParseResult(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                >
                  Discard / Upload Another
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={!hasPermission('upload_data')}
                  className="px-4 py-1.5 text-xs font-bold rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>Commit Import to Archive</span>
                </button>
              </div>
            </div>

            {/* Category KPIs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {/* New */}
              <div
                onClick={() => setActivePreviewTab('new')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activePreviewTab === 'new'
                    ? 'border-[#007AFF] bg-[#007AFF]/5 shadow-sm'
                    : 'border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                  <span>New Projects</span>
                  <span className="w-2 h-2 rounded-full bg-[#007AFF]" />
                </div>
                <div className="text-xl font-bold font-mono text-[#007AFF] mt-1">
                  {parseResult.newProjects.length}
                </div>
                <span className="text-[10px] text-slate-400">First-time Job IDs</span>
              </div>

              {/* Changed */}
              <div
                onClick={() => setActivePreviewTab('changed')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activePreviewTab === 'changed'
                    ? 'border-[#FF9F0A] bg-[#FF9F0A]/5 shadow-sm'
                    : 'border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                  <span>Changed Data</span>
                  <span className="w-2 h-2 rounded-full bg-[#FF9F0A]" />
                </div>
                <div className="text-xl font-bold font-mono text-[#FF9F0A] mt-1">
                  {parseResult.changedProjects.length}
                </div>
                <span className="text-[10px] text-slate-400">Requires Review</span>
              </div>

              {/* Existing */}
              <div
                onClick={() => setActivePreviewTab('existing')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activePreviewTab === 'existing'
                    ? 'border-[#34C759] bg-[#34C759]/5 shadow-sm'
                    : 'border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                  <span>Existing (Unchanged)</span>
                  <span className="w-2 h-2 rounded-full bg-[#34C759]" />
                </div>
                <div className="text-xl font-bold font-mono text-slate-800 dark:text-white mt-1">
                  {parseResult.existingProjects.length}
                </div>
                <span className="text-[10px] text-slate-400">No data modifications</span>
              </div>

              {/* Duplicates in file */}
              <div
                onClick={() => setActivePreviewTab('duplicate')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activePreviewTab === 'duplicate'
                    ? 'border-[#FF3B30] bg-[#FF3B30]/5 shadow-sm'
                    : 'border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                  <span>Duplicate in File</span>
                  <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
                </div>
                <div className="text-xl font-bold font-mono text-[#FF3B30] mt-1">
                  {parseResult.duplicateProjects.length}
                </div>
                <span className="text-[10px] text-slate-400">Filtered automatically</span>
              </div>

              {/* Errors */}
              <div
                onClick={() => setActivePreviewTab('error')}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activePreviewTab === 'error'
                    ? 'border-[#FF3B30] bg-[#FF3B30]/5 shadow-sm'
                    : 'border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]'
                }`}
              >
                <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between">
                  <span>Validation Errors</span>
                  <span className="w-2 h-2 rounded-full bg-[#FF3B30]" />
                </div>
                <div className="text-xl font-bold font-mono text-[#FF3B30] mt-1">
                  {parseResult.errorRows.length}
                </div>
                <span className="text-[10px] text-slate-400">Malformed rows</span>
              </div>
            </div>
          </div>

          {/* Interactive Conflict Resolver for Changed Projects */}
          {activePreviewTab === 'changed' && parseResult.changedProjects.length > 0 && (
            <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-[#FF9F0A]" />
                    <span>Review & Resolve Changed Project Data</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Select how each changed record should be handled. By default, stored project data is preserved.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    onClick={() => {
                      const updated = new Map(conflictResolutions);
                      parseResult.changedProjects.forEach((cp) => {
                        if (cp.job_id) updated.set(String(cp.job_id), 'use_incoming');
                      });
                      setConflictResolutions(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Set All to Incoming
                  </button>
                  <button
                    onClick={() => {
                      const updated = new Map(conflictResolutions);
                      parseResult.changedProjects.forEach((cp) => {
                        if (cp.job_id) updated.set(String(cp.job_id), 'keep_existing');
                      });
                      setConflictResolutions(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Keep All Existing
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-white/5 space-y-3">
                {parseResult.changedProjects.map((item) => {
                  const resolution = conflictResolutions.get(String(item.job_id)) || 'keep_existing';
                  return (
                    <div key={item.job_id} className="pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#007AFF] text-xs">
                            #{item.job_id}
                          </span>
                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                            {item.job_name}
                          </span>
                        </div>

                        {/* Resolution segmented buttons */}
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-lg text-xs">
                          <button
                            onClick={() => {
                              const updated = new Map(conflictResolutions);
                              updated.set(String(item.job_id), 'keep_existing');
                              setConflictResolutions(updated);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                              resolution === 'keep_existing'
                                ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Keep Existing
                          </button>
                          <button
                            onClick={() => {
                              const updated = new Map(conflictResolutions);
                              updated.set(String(item.job_id), 'use_incoming');
                              setConflictResolutions(updated);
                            }}
                            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                              resolution === 'use_incoming'
                                ? 'bg-white dark:bg-[#2C2C2E] text-[#007AFF] shadow-sm'
                                : 'text-slate-500 hover:text-slate-900'
                            }`}
                          >
                            Use Incoming
                          </button>
                        </div>
                      </div>

                      {/* Diff view */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                        {item.differences?.map((diff, dIdx) => (
                          <div
                            key={dIdx}
                            className="p-2 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5"
                          >
                            <span className="text-[10px] text-slate-400 uppercase block">
                              {diff.field}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="line-through text-[#FF3B30]">{diff.existing}</span>
                              <ArrowRight className="w-3 h-3 text-slate-400" />
                              <span className="text-[#34C759] font-bold">{diff.incoming}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview Table of Rows */}
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                {activePreviewTab === 'summary' && 'All Valid Rows in Batch'}
                {activePreviewTab === 'new' && 'New Projects to be Registered'}
                {activePreviewTab === 'changed' && 'Changed Project Records'}
                {activePreviewTab === 'existing' && 'Existing Unchanged Records'}
                {activePreviewTab === 'duplicate' && 'Duplicate Rows within File'}
                {activePreviewTab === 'error' && 'Validation Errors'}
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                {parseResult.validRows.length} valid / {parseResult.totalRows} total rows
              </span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase tracking-wider">
                    <th className="py-2.5 px-4">Row #</th>
                    <th className="py-2.5 px-4">Job ID</th>
                    <th className="py-2.5 px-4">Job Name</th>
                    <th className="py-2.5 px-4">Branch</th>
                    <th className="py-2.5 px-4">Allocated Box</th>
                    <th className="py-2.5 px-4">Dossier</th>
                    <th className="py-2.5 px-4">Category</th>
                    <th className="py-2.5 px-4">Details / Errors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {(activePreviewTab === 'new'
                    ? parseResult.newProjects
                    : activePreviewTab === 'changed'
                    ? parseResult.changedProjects
                    : activePreviewTab === 'existing'
                    ? parseResult.existingProjects
                    : activePreviewTab === 'duplicate'
                    ? parseResult.duplicateProjects
                    : activePreviewTab === 'error'
                    ? parseResult.errorRows
                    : parseResult.validRows
                  ).map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                      <td className="py-2.5 px-4 font-mono text-slate-400">{r.rowIndex}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#007AFF]">
                        {r.job_id ? `#${r.job_id}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                        {r.job_name || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">{r.branch_name || '—'}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold">
                        {r.allocatedBox || '—'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-500">
                        {r.allocatedDossier ? `Dossier ${r.allocatedDossier}` : '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            r.category === 'new'
                              ? 'bg-[#007AFF]/10 text-[#007AFF]'
                              : r.category === 'changed'
                              ? 'bg-[#FF9F0A]/10 text-[#FF9F0A]'
                              : r.category === 'existing'
                              ? 'bg-[#34C759]/10 text-[#34C759]'
                              : 'bg-[#FF3B30]/10 text-[#FF3B30]'
                          }`}
                        >
                          {r.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {r.errorMessage ||
                          (r.differences && `${r.differences.length} field(s) changed`) ||
                          'Ready to commit'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* IMPORT HISTORY TABLE */}
      {/* ============================================================== */}
      <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#007AFF]" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Historical Import Batches Log
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-2.5 px-4">Workbook Filename</th>
                <th className="py-2.5 px-4">Imported At</th>
                <th className="py-2.5 px-4">Operator</th>
                <th className="py-2.5 px-4">Total Rows</th>
                <th className="py-2.5 px-4 text-[#007AFF]">New</th>
                <th className="py-2.5 px-4 text-[#FF9F0A]">Changed</th>
                <th className="py-2.5 px-4">Duplicates Filtered</th>
                <th className="py-2.5 px-4">Batch Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {importBatches.map((batch) => (
                <tr key={batch.id}>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                    {batch.filename}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">
                    {new Date(batch.imported_at).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                    {batch.imported_by}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                    {batch.total_rows}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#007AFF] font-bold">
                    {batch.new_count}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#FF9F0A] font-bold">
                    {batch.changed_count}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {batch.duplicate_count}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        batch.status === 'Completed'
                          ? 'bg-[#34C759]/10 text-[#34C759]'
                          : 'bg-[#FF9F0A]/10 text-[#FF9F0A]'
                      }`}
                    >
                      {batch.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
