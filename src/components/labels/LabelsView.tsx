import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Copy,
  Download,
  Eye,
  FileText,
  Layers,
  Lock,
  Package,
  Printer,
  QrCode,
  ShieldAlert,
  Sliders,
  Tag,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  generateBarcodeSvg,
  generateZplCode,
  LabelData,
} from '../../utils/labelGenerator';
import { storage } from '../../utils/storage';

export const LabelsView: React.FC = () => {
  const {
    boxes,
    settings,
    currentUser,
    hasPermission,
  } = useApp();

  // Mode: 'auto' | 'manual'
  const [labelMode, setLabelMode] = useState<'auto' | 'manual'>('auto');

  // Automatic Mode Selection
  const [selectedBoxNumber, setSelectedBoxNumber] = useState<string>(
    boxes[0]?.box_number || 'D41'
  );
  const [selectedLabelType, setSelectedLabelType] = useState<'box' | 'dossier' | 'all'>('box');
  const [selectedDossierNum, setSelectedDossierNum] = useState<number>(1);

  // Manual Mode Inputs
  const [manualBoxNumber, setManualBoxNumber] = useState('D43');
  const [manualFirstProject, setManualFirstProject] = useState<number>(35800);
  const [manualProjectCount, setManualProjectCount] = useState<number>(300);
  const [manualConflictWarning, setManualConflictWarning] = useState<string | null>(null);

  // ZPL Modal / Viewer
  const [showZplCode, setShowZplCode] = useState(false);
  const [copiedZpl, setCopiedZpl] = useState(false);

  // Active Box
  const activeBox = boxes.find((b) => b.box_number === selectedBoxNumber) || boxes[0];

  // Automatic label calculation
  const autoLabelData: LabelData = useMemo(() => {
    if (!activeBox) {
      return {
        title: 'BOX LABEL',
        type: 'box',
        boxNumber: 'D41',
        firstProject: 35150,
        lastProject: 35449,
        projectCount: 300,
        barcodeValue: 'BOX-D41-35150-35449',
        operator: currentUser.full_name,
      };
    }

    if (selectedLabelType === 'dossier') {
      const pPerD = activeBox.projects_per_dossier || 50;
      const fProj = activeBox.first_project + (selectedDossierNum - 1) * pPerD;
      const lProj = fProj + pPerD - 1;
      return {
        title: `DOSSIER LABEL`,
        type: 'dossier',
        boxNumber: activeBox.box_number,
        dossierNumber: selectedDossierNum,
        firstProject: fProj,
        lastProject: lProj,
        projectCount: pPerD,
        barcodeValue: `DOS-BOX-${activeBox.box_number}-D${selectedDossierNum}-${fProj}`,
        operator: currentUser.full_name,
      };
    }

    return {
      title: 'BOX LABEL',
      type: 'box',
      boxNumber: activeBox.box_number,
      firstProject: activeBox.first_project,
      lastProject: activeBox.last_project,
      projectCount: activeBox.capacity,
      barcodeValue: `BOX-${activeBox.box_number}-${activeBox.first_project}-${activeBox.last_project}`,
      operator: currentUser.full_name,
    };
  }, [activeBox, selectedLabelType, selectedDossierNum, currentUser]);

  // Manual Last Project Calculation: Last Project = First Project + Project Count - 1
  const manualLastProject = useMemo(() => {
    return Math.max(manualFirstProject, manualFirstProject + manualProjectCount - 1);
  }, [manualFirstProject, manualProjectCount]);

  // Check manual overlap with registered ranges
  const manualOverlapCheck = useMemo(() => {
    for (const range of settings.allocation_ranges) {
      const isOverlap =
        Math.max(range.first_project, manualFirstProject) <=
        Math.min(range.last_project, manualLastProject);
      if (isOverlap) {
        return `Conflict Detected: Range overlaps with registered Box ${range.box} (${range.first_project}–${range.last_project}). Elevated permission and audit record required.`;
      }
    }
    return null;
  }, [manualFirstProject, manualLastProject, settings.allocation_ranges]);

  const manualLabelData: LabelData = useMemo(() => {
    return {
      title: 'MANUAL BOX LABEL',
      type: 'box',
      boxNumber: manualBoxNumber,
      firstProject: manualFirstProject,
      lastProject: manualLastProject,
      projectCount: manualProjectCount,
      barcodeValue: `MANUAL-${manualBoxNumber}-${manualFirstProject}-${manualLastProject}`,
      operator: currentUser.full_name,
    };
  }, [manualBoxNumber, manualFirstProject, manualLastProject, manualProjectCount, currentUser]);

  const activeLabel = labelMode === 'auto' ? autoLabelData : manualLabelData;
  const barcodeSvg = generateBarcodeSvg(activeLabel.barcodeValue, 45);
  const zplScript = generateZplCode(activeLabel);

  const handlePrintBrowser = () => {
    // Record audit log for label generation
    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: labelMode === 'manual' ? 'MANUAL_LABEL_CREATED' : 'LABEL_GENERATED',
      entity_type: 'label',
      entity_id: `${activeLabel.boxNumber}-${activeLabel.type}`,
      reason: manualOverlapCheck || undefined,
      details: `Printed 100x50mm ${activeLabel.type} label for Box ${activeLabel.boxNumber} (Range: ${activeLabel.firstProject}–${activeLabel.lastProject}).`,
    });

    window.print();
  };

  const handleDownloadZpl = () => {
    const blob = new Blob([zplScript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeLabel.boxNumber}_${activeLabel.type}_label.zpl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10 no-print">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Archive Label Printing (100 × 50 mm)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Zebra industrial thermal printer & standard browser print support with Code 128 barcode barcodes.
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl">
          <button
            onClick={() => setLabelMode('auto')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              labelMode === 'auto'
                ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Automatic Label
          </button>
          <button
            onClick={() => setLabelMode('manual')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              labelMode === 'manual'
                ? 'bg-white dark:bg-[#2C2C2E] text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Manual Range Label
          </button>
        </div>
      </div>

      {/* Main Grid: Controls vs Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 no-print">
        {/* Controls Column (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {labelMode === 'auto' ? (
            /* Automatic Generator Controls */
            <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#007AFF]" />
                <span>Select Registered Box & Type</span>
              </h3>

              {/* Box select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Target Box
                </label>
                <select
                  value={selectedBoxNumber}
                  onChange={(e) => setSelectedBoxNumber(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                >
                  {boxes.map((b) => (
                    <option key={b.box_number} value={b.box_number}>
                      Box {b.box_number} (Range: {b.first_project} – {b.last_project})
                    </option>
                  ))}
                </select>
              </div>

              {/* Label Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Label Output Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setSelectedLabelType('box')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      selectedLabelType === 'box'
                        ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Box Label
                  </button>
                  <button
                    onClick={() => setSelectedLabelType('dossier')}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      selectedLabelType === 'dossier'
                        ? 'border-[#007AFF] bg-[#007AFF]/10 text-[#007AFF]'
                        : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Dossier Label
                  </button>
                </div>
              </div>

              {/* Dossier number selector if dossier */}
              {selectedLabelType === 'dossier' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Select Dossier (1 to 6)
                  </label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSelectedDossierNum(num)}
                        className={`py-2 text-xs font-bold rounded-lg border text-center transition-all ${
                          selectedDossierNum === num
                            ? 'border-[#007AFF] bg-[#007AFF] text-white'
                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        D{num}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Batch Print Actions */}
              <div className="pt-2 border-t border-slate-100 dark:border-white/5 space-y-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Quick Actions for Box {selectedBoxNumber}
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => {
                      setSelectedLabelType('box');
                      handlePrintBrowser();
                    }}
                    className="p-2 text-left rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#007AFF] transition-colors"
                  >
                    <span className="font-semibold block text-slate-800 dark:text-white">Print Box Label</span>
                    <span className="text-[10px] text-slate-400">Single box header</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedLabelType('dossier');
                      setSelectedDossierNum(1);
                      handlePrintBrowser();
                    }}
                    className="p-2 text-left rounded-lg border border-slate-200 dark:border-white/10 hover:border-[#007AFF] transition-colors"
                  >
                    <span className="font-semibold block text-slate-800 dark:text-white">Print Dossier Labels</span>
                    <span className="text-[10px] text-slate-400">Dossiers 1 through 6</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Manual Label Generator Controls */
            <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#007AFF]" />
                <span>Manual Unregistered Box Parameters</span>
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Box Identifier
                </label>
                <input
                  type="text"
                  value={manualBoxNumber}
                  onChange={(e) => setManualBoxNumber(e.target.value)}
                  placeholder="e.g. D43, ARCH-99"
                  className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    First Project #
                  </label>
                  <input
                    type="number"
                    value={manualFirstProject}
                    onChange={(e) => setManualFirstProject(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Project Count
                  </label>
                  <input
                    type="number"
                    value={manualProjectCount}
                    onChange={(e) => setManualProjectCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl font-mono text-xs">
                <span className="text-[10px] text-slate-400 uppercase block">Calculated Last Project:</span>
                <span className="text-sm font-bold text-[#007AFF] mt-0.5 block">
                  {manualLastProject}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">
                  Formula: {manualFirstProject} + {manualProjectCount} - 1 = {manualLastProject}
                </span>
              </div>

              {/* Overlap conflict warning */}
              {manualOverlapCheck && (
                <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-xs text-[#FF3B30] space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldAlert className="w-4 h-4 text-[#FF3B30]" />
                    <span>Allocation Collision Warning</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    {manualOverlapCheck}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="p-5 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 space-y-3">
            <button
              onClick={handlePrintBrowser}
              className="w-full py-2.5 px-4 rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Label (100 × 50 mm)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setShowZplCode(!showZplCode)}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{showZplCode ? 'Hide ZPL' : 'View Zebra ZPL'}</span>
              </button>

              <button
                onClick={handleDownloadZpl}
                className="py-2 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .ZPL</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Physical Preview Column (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#007AFF]" />
              <span>100 × 50 mm Label Visual Preview (2:1 Ratio)</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Matches uploaded physical label standard
            </span>
          </div>

          {/* Physical 100x50 mm Visual Container */}
          <div className="p-6 bg-slate-200/60 dark:bg-black/40 rounded-3xl border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-x-auto">
            {/* The Label: 100mm x 50mm styled card (ratio 2:1) */}
            <div
              className="w-[500px] h-[250px] bg-white text-black p-5 rounded-md shadow-xl border-2 border-black flex flex-col justify-between shrink-0 select-none relative font-sans"
              style={{
                fontFamily:
                  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
              }}
            >
              {/* Top Header */}
              <div className="border-b-2 border-black pb-1.5 flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight leading-none text-black">
                    INTERCOM ARCHIVE MANAGEMENT
                  </h4>
                  <span className="text-[9px] font-bold tracking-widest text-black uppercase mt-0.5 block">
                    OPERATIONAL PROJECT REPORT REPOSITORY
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 bg-black text-white rounded">
                  ARMS-STD
                </span>
              </div>

              {/* Main Information */}
              <div className="flex items-start justify-between gap-4 py-1">
                <div>
                  <div className="text-3xl font-black tracking-tight text-black leading-none">
                    {activeLabel.type === 'box'
                      ? `BOX ${activeLabel.boxNumber}`
                      : `BOX ${activeLabel.boxNumber} / D${activeLabel.dossierNumber}`}
                  </div>
                  <div className="mt-2 text-xs font-mono font-bold text-black flex items-center gap-2">
                    <span className="text-[10px] text-gray-700 uppercase">PROJECT RANGE:</span>
                    <span className="text-base font-extrabold">
                      {activeLabel.firstProject} — {activeLabel.lastProject}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-gray-700 mt-1">
                    TOTAL CAPACITY: <strong>{activeLabel.projectCount} PROJECTS</strong>
                  </div>
                </div>

                {/* QR / Mini Box indicator */}
                <div className="w-16 h-16 border-2 border-black p-1 flex flex-col items-center justify-center text-center shrink-0">
                  <span className="text-[9px] font-black uppercase leading-tight">INTERCOM</span>
                  <span className="text-sm font-black mt-0.5">{activeLabel.boxNumber}</span>
                  {activeLabel.dossierNumber && (
                    <span className="text-[9px] font-bold">D{activeLabel.dossierNumber}</span>
                  )}
                </div>
              </div>

              {/* Barcode Strip */}
              <div className="space-y-1">
                <div className="h-10 w-full overflow-hidden flex items-center justify-center">
                  <div
                    dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                    className="w-full h-full flex items-center justify-center"
                  />
                </div>
                <div className="text-center font-mono text-[10px] font-bold tracking-widest text-black">
                  *{activeLabel.barcodeValue}*
                </div>
              </div>

              {/* Bottom Metadata */}
              <div className="border-t border-black pt-1 flex items-center justify-between text-[8px] font-mono font-semibold text-gray-800">
                <span>DATE: {new Date().toISOString().split('T')[0]}</span>
                <span>CONFIRMED ARMS ALLOCATION</span>
                <span>OPERATOR: {activeLabel.operator || 'ADMIN'}</span>
              </div>
            </div>
          </div>

          {/* ZPL Code Inspector */}
          {showZplCode && (
            <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs space-y-2 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase text-[11px]">
                  Zebra Programming Language (ZPL II) Script
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(zplScript);
                    setCopiedZpl(true);
                    setTimeout(() => setCopiedZpl(false), 2000);
                  }}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs text-white flex items-center gap-1 transition-colors"
                >
                  {copiedZpl ? <Check className="w-3 h-3 text-[#34C759]" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedZpl ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="p-3 bg-black/50 rounded-xl overflow-x-auto text-[11px] leading-relaxed text-emerald-400 max-h-56">
                {zplScript}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINT-ONLY CONTAINER (Triggered on window.print()) */}
      {/* ============================================================== */}
      <div className="print-only-container">
        <div
          style={{
            width: '100mm',
            height: '50mm',
            padding: '4mm',
            boxSizing: 'border-box',
            fontFamily: 'sans-serif',
            color: '#000000',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: '1px solid #000000',
          }}
        >
          <div style={{ borderBottom: '1.5px solid #000', paddingBottom: '2mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '11pt', fontWeight: 900, lineHeight: 1 }}>INTERCOM ARCHIVE MANAGEMENT</div>
              <div style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.5px' }}>OPERATIONAL PROJECT REPORTS</div>
            </div>
            <div style={{ fontSize: '8pt', fontWeight: 800, background: '#000', color: '#fff', padding: '1px 4px' }}>ARMS</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '2mm 0' }}>
            <div>
              <div style={{ fontSize: '16pt', fontWeight: 900, lineHeight: 1 }}>
                {activeLabel.type === 'box' ? `BOX ${activeLabel.boxNumber}` : `BOX ${activeLabel.boxNumber} / D${activeLabel.dossierNumber}`}
              </div>
              <div style={{ fontSize: '10pt', fontWeight: 800, fontFamily: 'monospace', marginTop: '2mm' }}>
                RANGE: {activeLabel.firstProject} — {activeLabel.lastProject}
              </div>
              <div style={{ fontSize: '8pt', fontFamily: 'monospace', color: '#444' }}>
                PROJECTS: {activeLabel.projectCount}
              </div>
            </div>
            <div style={{ border: '1.5px solid #000', padding: '2mm', textAlign: 'center', width: '20mm' }}>
              <div style={{ fontSize: '7pt', fontWeight: 900 }}>INTERCOM</div>
              <div style={{ fontSize: '11pt', fontWeight: 900 }}>{activeLabel.boxNumber}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ height: '32px', width: '100%', overflow: 'hidden' }}>
              <div dangerouslySetInnerHTML={{ __html: barcodeSvg }} style={{ height: '100%' }} />
            </div>
            <div style={{ fontSize: '8pt', fontFamily: 'monospace', fontWeight: 700, letterSpacing: '2px' }}>
              *{activeLabel.barcodeValue}*
            </div>
          </div>

          <div style={{ borderTop: '1px solid #000', paddingTop: '1mm', display: 'flex', justifyContent: 'space-between', fontSize: '6pt', fontFamily: 'monospace' }}>
            <span>DATE: {new Date().toISOString().split('T')[0]}</span>
            <span>ARMS CONFIRMED ALLOCATION</span>
            <span>OPERATOR: {activeLabel.operator || 'SYSTEM'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
