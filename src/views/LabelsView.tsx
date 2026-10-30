import React, { useState, useMemo } from 'react';
import {
  Printer,
  QrCode,
  Layers,
  Folder,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { LabelPrintPreview, LabelData } from '../components/LabelPrintPreview';

export const LabelsView: React.FC = () => {
  const { boxes, projects, settings, currentUser, logAudit } = useArchive();

  const [mode, setMode] = useState<'automatic' | 'manual'>('automatic');

  // Automatic mode state
  const [selectedBoxNumber, setSelectedBoxNumber] = useState<string>(boxes[0]?.box_number || 'D41');
  const [selectedDossierNum, setSelectedDossierNum] = useState<number | 'all'>('all');

  // Manual mode state
  const [manualBoxNumber, setManualBoxNumber] = useState('D43');
  const [manualFirstProject, setManualFirstProject] = useState<number>(35800);
  const [manualProjectCount, setManualProjectCount] = useState<number>(300);

  // Computed Last Project = First Project + Project Count - 1
  const manualLastProject = manualFirstProject + manualProjectCount - 1;

  // Print Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLabels, setPreviewLabels] = useState<LabelData[]>([]);

  // Check overlap for manual labels
  const manualOverlapConflict = useMemo(() => {
    for (const range of settings.box_ranges) {
      const isOverlap =
        Math.max(range.start_project, manualFirstProject) <=
        Math.min(range.end_project, manualLastProject);
      if (isOverlap) {
        return `Conflicts with registered Box ${range.box_number} range (${range.start_project}–${range.end_project})`;
      }
    }
    return null;
  }, [manualFirstProject, manualLastProject, settings.box_ranges]);

  const handleGenerateAutomaticLabels = (targetType: 'box' | 'dossiers' | 'all') => {
    const box = boxes.find(b => b.box_number === selectedBoxNumber);
    if (!box) return;

    const labelsToPrint: LabelData[] = [];

    // Master box label
    if (targetType === 'box' || targetType === 'all') {
      labelsToPrint.push({
        type: 'box',
        title: `Intercom Physical Archive Box ${box.box_number}`,
        box_number: box.box_number,
        project_start: box.start_project,
        project_end: box.end_project,
        project_count: box.capacity,
        barcode_value: `BOX-${box.box_number}-${box.start_project}`,
      });
    }

    // Dossier labels
    if (targetType === 'dossiers' || targetType === 'all') {
      const dossiersToInclude =
        selectedDossierNum === 'all'
          ? Array.from({ length: box.dossier_count }, (_, i) => i + 1)
          : [selectedDossierNum];

      for (const dNum of dossiersToInclude) {
        const dStart = box.start_project + (dNum - 1) * settings.projects_per_dossier;
        const dEnd = dStart + settings.projects_per_dossier - 1;

        labelsToPrint.push({
          type: 'dossier',
          title: `Intercom Archive Dossier #${dNum}`,
          box_number: box.box_number,
          dossier_number: dNum,
          project_start: dStart,
          project_end: dEnd,
          project_count: settings.projects_per_dossier,
          barcode_value: `DOS-${box.box_number}-D${dNum}`,
        });
      }
    }

    setPreviewLabels(labelsToPrint);
    setPreviewOpen(true);

    logAudit({
      action: 'LABEL_GENERATE',
      entity_type: 'BOX',
      entity_id: box.box_number,
      new_value: `Generated ${labelsToPrint.length} labels (${targetType})`,
      reason: `Thermal label printing batch by ${currentUser.full_name}`,
    });
  };

  const handleGenerateManualLabel = () => {
    if (manualOverlapConflict && currentUser.role !== 'System Manager') {
      alert(`Cannot generate manual label: ${manualOverlapConflict}`);
      return;
    }

    const labelsToPrint: LabelData[] = [
      {
        type: 'box',
        title: `Manual Physical Archive Box ${manualBoxNumber}`,
        box_number: manualBoxNumber,
        project_start: manualFirstProject,
        project_end: manualLastProject,
        project_count: manualProjectCount,
        barcode_value: `MAN-${manualBoxNumber}-${manualFirstProject}`,
      },
    ];

    setPreviewLabels(labelsToPrint);
    setPreviewOpen(true);

    logAudit({
      action: 'LABEL_GENERATE',
      entity_type: 'BOX',
      entity_id: manualBoxNumber,
      new_value: `Manual label range: ${manualFirstProject}–${manualLastProject} (${manualProjectCount} projects)`,
      reason: manualOverlapConflict
        ? `Manual label override by System Manager: ${manualOverlapConflict}`
        : `Manual label generation by ${currentUser.full_name}`,
    });
  };

  const currentBox = boxes.find(b => b.box_number === selectedBoxNumber);

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <Printer className="w-5 h-5 text-[#007AFF]" />
            <span>Archive Label Generator (100 × 50 mm)</span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
            Zebra thermal printer compliant, high-resolution Code 128 barcodes, matching official Intercom physical archive design
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xs">
          <button
            onClick={() => setMode('automatic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'automatic'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-[#1D1D1F]'
            }`}
          >
            Automatic (Registered Boxes)
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-[#007AFF] text-white shadow-xs'
                : 'text-neutral-600 dark:text-neutral-400 hover:text-[#1D1D1F]'
            }`}
          >
            Manual Generation
          </button>
        </div>
      </div>

      {/* AUTOMATIC GENERATION MODE */}
      {mode === 'automatic' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4 p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 shadow-xs">
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Select Archive Box & Dossier
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5">
                  Select Registered Box
                </label>
                <select
                  value={selectedBoxNumber}
                  onChange={e => setSelectedBoxNumber(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                >
                  {boxes.map(b => (
                    <option key={b.box_number} value={b.box_number}>
                      Box {b.box_number} (Projects #{b.start_project}–#{b.end_project})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1.5">
                  Select Dossier Target
                </label>
                <select
                  value={selectedDossierNum}
                  onChange={e =>
                    setSelectedDossierNum(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="w-full px-3 py-2.5 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
                >
                  <option value="all">All Dossiers (1 to 6)</option>
                  {currentBox &&
                    Array.from({ length: currentBox.dossier_count }, (_, i) => i + 1).map(d => (
                      <option key={d} value={d}>
                        Dossier #{d}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {currentBox && (
              <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-800 text-xs space-y-2">
                <div className="font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Automatic Allocation Preview:
                </div>
                <div className="grid grid-cols-3 gap-2 text-neutral-600 dark:text-neutral-400 font-mono text-[11px]">
                  <div>Start: #{currentBox.start_project}</div>
                  <div>End: #{currentBox.end_project}</div>
                  <div>Capacity: {currentBox.capacity} Projects</div>
                </div>
              </div>
            )}

            {/* Print Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => handleGenerateAutomaticLabels('box')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] transition-all shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Box Label Only</span>
              </button>

              <button
                onClick={() => handleGenerateAutomaticLabels('dossiers')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors"
              >
                <Folder className="w-4 h-4 text-[#007AFF]" />
                <span>Print Dossier Labels</span>
              </button>

              <button
                onClick={() => handleGenerateAutomaticLabels('all')}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100 transition-colors"
              >
                <Layers className="w-4 h-4 text-emerald-600" />
                <span>Print Complete Set (Box + 6 Dossiers)</span>
              </button>
            </div>
          </div>

          {/* Thermal Label Spec Reference Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#007AFF]" />
              <span>Label Specification Standard</span>
            </h3>

            <div className="space-y-2 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span>Label Dimension:</span>
                <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">100 × 50 mm</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span>Printer Type:</span>
                <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Zebra Thermal Direct</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span>Barcode Symbology:</span>
                <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Code 128 Alphanumeric</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-800">
                <span>Color Mode:</span>
                <strong className="text-[#1D1D1F] dark:text-[#F5F5F7]">Monochrome Black & White</strong>
              </div>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl text-[11px] text-[#86868B] dark:text-[#98989D]">
              Automatic labels directly bind with database allocation records, ensuring zero mismatch between physical folder labels and the ARMS system database.
            </div>
          </div>
        </div>
      )}

      {/* MANUAL GENERATION MODE */}
      {mode === 'manual' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-5 max-w-2xl">
          <div>
            <h2 className="text-base font-bold text-[#1D1D1F] dark:text-[#F5F5F7]">
              Manual Label Generator
            </h2>
            <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
              Generate thermal labels for unregistered or legacy boxes using the formula: <code className="font-mono text-[#007AFF]">Last Project = First Project + Project Count - 1</code>
            </p>
          </div>

          {manualOverlapConflict && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Allocation Range Conflict Warning:</strong>
                <div>{manualOverlapConflict}</div>
                {currentUser.role === 'System Manager' ? (
                  <div className="mt-1 text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                    As System Manager, you may proceed with an audit record.
                  </div>
                ) : (
                  <div className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
                    Elevated System Manager permission required to print conflicting ranges.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                Box Number Identifier
              </label>
              <input
                type="text"
                value={manualBoxNumber}
                onChange={e => setManualBoxNumber(e.target.value)}
                placeholder="e.g. D43"
                className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                First Project Number
              </label>
              <input
                type="number"
                value={manualFirstProject}
                onChange={e => setManualFirstProject(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
                Project Count
              </label>
              <input
                type="number"
                value={manualProjectCount}
                onChange={e => setManualProjectCount(Number(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
              />
            </div>
          </div>

          {/* Computed Result Box */}
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/80 dark:border-neutral-800 text-xs">
            <div className="text-[11px] text-neutral-500 uppercase tracking-wider font-semibold mb-1">
              Automatically Calculated Last Project:
            </div>
            <div className="text-lg font-bold font-mono text-[#007AFF]">
              #{manualLastProject}
            </div>
            <div className="text-[11px] text-neutral-400 mt-1">
              Calculated Range: #{manualFirstProject} — #{manualLastProject} ({manualProjectCount} units)
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerateManualLabel}
              disabled={Boolean(manualOverlapConflict && currentUser.role !== 'System Manager')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white transition-all shadow-xs ${
                manualOverlapConflict && currentUser.role !== 'System Manager'
                  ? 'bg-neutral-300 dark:bg-neutral-800 cursor-not-allowed'
                  : 'bg-[#007AFF] hover:bg-[#0A84FF]'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>Preview & Print Manual Label</span>
            </button>
          </div>
        </div>
      )}

      {/* Label Print Preview Modal */}
      <LabelPrintPreview
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        labels={previewLabels}
      />
    </div>
  );
};
