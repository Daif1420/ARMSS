import React, { useState } from 'react';
import {
  Settings,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Boxes,
  Sliders,
  Database,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { BoxRangeConfig } from '../types';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToSampleData, currentUser } = useArchive();

  const [ranges, setRanges] = useState<BoxRangeConfig[]>(settings.box_ranges);
  const [dossiersPerBox, setDossiersPerBox] = useState(settings.dossiers_per_box);
  const [projectsPerDossier, setProjectsPerDossier] = useState(settings.projects_per_dossier);
  const [boxAggregation, setBoxAggregation] = useState<'sum' | 'distinct'>(settings.box_aggregation_rule);
  const [deliveryScope, setDeliveryScope] = useState<'both' | 'project' | 'box'>(settings.delivery_scope);

  const [newBoxNumber, setNewBoxNumber] = useState('');
  const [newStart, setNewStart] = useState<number>(35800);
  const [newEnd, setNewEnd] = useState<number>(36099);

  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSaveSettings = () => {
    updateSettings({
      box_ranges: ranges,
      dossiers_per_box: dossiersPerBox,
      projects_per_dossier: projectsPerDossier,
      box_aggregation_rule: boxAggregation,
      delivery_scope: deliveryScope,
    });
    setFeedback('System settings and allocation ranges saved successfully');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAddRange = () => {
    if (!newBoxNumber.trim()) {
      alert('Box number is required (e.g. D43)');
      return;
    }
    if (newEnd <= newStart) {
      alert('End project number must be greater than start number');
      return;
    }

    const capacity = newEnd - newStart + 1;
    const newConfig: BoxRangeConfig = {
      box_number: newBoxNumber.trim(),
      start_project: newStart,
      end_project: newEnd,
      capacity,
    };

    setRanges([...ranges, newConfig]);
    setNewBoxNumber('');
    setNewStart(newEnd + 1);
    setNewEnd(newEnd + 300);
  };

  const handleRemoveRange = (boxNumber: string) => {
    if (boxNumber === 'D41' || boxNumber === 'D42') {
      alert('D41 and D42 are confirmed specification ranges and cannot be removed');
      return;
    }
    setRanges(ranges.filter(r => r.box_number !== boxNumber));
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#007AFF]" />
            <span>Archive Allocation & System Settings</span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
            Configure confirmed box allocation ranges, dossier capacity rules, and operational aggregation policies
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF] transition-all shadow-xs"
        >
          <Save className="w-4 h-4" />
          <span>Save System Settings</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* CONFIRMED ALLOCATION RANGES SECTION */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#007AFF]" />
              <span>Approved Box Allocation Ranges</span>
            </h2>
            <p className="text-xs text-[#86868B] dark:text-[#98989D]">
              Confirmed ranges D41 (35150–35449) and D42 (35500–35799). Custom approved future ranges can be appended here.
            </p>
          </div>
        </div>

        <div className="border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 dark:bg-neutral-900/80 text-[#86868B] dark:text-[#98989D] border-b border-neutral-200 dark:border-neutral-800 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Box Number</th>
                <th className="py-2.5 px-3">Start Project #</th>
                <th className="py-2.5 px-3">End Project #</th>
                <th className="py-2.5 px-3 text-right">Standard Capacity</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {ranges.map(r => (
                <tr key={r.box_number} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-[#007AFF]">
                    Box {r.box_number}
                  </td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">{r.start_project}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums">{r.end_project}</td>
                  <td className="py-2.5 px-3 text-right font-mono tabular-nums">{r.capacity} projects</td>
                  <td className="py-2.5 px-3">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {r.box_number === 'D41' || r.box_number === 'D42' ? 'Confirmed Spec' : 'Custom Configured'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {r.box_number !== 'D41' && r.box_number !== 'D42' ? (
                      <button
                        onClick={() => handleRemoveRange(r.box_number)}
                        className="p-1 text-rose-500 hover:text-rose-700"
                        title="Delete Range"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-400">Locked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add New Approved Box Range */}
        <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-800 space-y-3">
          <span className="text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7]">
            Register Approved Additional Box Range:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Box Number</label>
              <input
                type="text"
                value={newBoxNumber}
                onChange={e => setNewBoxNumber(e.target.value)}
                placeholder="e.g. D43"
                className="w-full px-3 py-1.5 rounded-lg text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">First Project #</label>
              <input
                type="number"
                value={newStart}
                onChange={e => setNewStart(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7]"
              />
            </div>
            <div>
              <label className="block text-[11px] text-neutral-500 mb-1">Last Project #</label>
              <input
                type="number"
                value={newEnd}
                onChange={e => setNewEnd(Number(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg text-xs font-mono border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7]"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleAddRange}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#007AFF] hover:bg-[#0A84FF]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Range</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CAPACITY & OPERATIONAL RULES */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#007AFF]" />
          <span>Operational Capacity & Aggregation Policies</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Standard Dossiers per Box
            </label>
            <input
              type="number"
              value={dossiersPerBox}
              onChange={e => setDossiersPerBox(Number(e.target.value) || 6)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7]"
            />
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Default standard: 6 dossiers per physical box
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Projects per Dossier
            </label>
            <input
              type="number"
              value={projectsPerDossier}
              onChange={e => setProjectsPerDossier(Number(e.target.value) || 50)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7]"
            />
            <span className="text-[11px] text-neutral-400 mt-0.5 block">
              Default standard: 50 projects per dossier (50 × 6 = 300 projects/box)
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Total Box Aggregation Rule (KPI)
            </label>
            <select
              value={boxAggregation}
              onChange={e => setBoxAggregation(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7]"
            >
              <option value="sum">Sum of source Total Box values</option>
              <option value="distinct">Distinct project count ratio</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] mb-1">
              Delivery Handover Scope
            </label>
            <select
              value={deliveryScope}
              onChange={e => setDeliveryScope(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-[#1D1D1F] dark:text-[#F5F5F7]"
            >
              <option value="both">Both Individual Project & Complete Box Delivery</option>
              <option value="project">Individual Project Delivery Only</option>
              <option value="box">Complete Box Delivery Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* SYSTEM MAINTENANCE / RESET DATA */}
      <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-neutral-800 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
          <Database className="w-4 h-4 text-rose-500" />
          <span>System Reset & Local State Management</span>
        </h2>
        <p className="text-xs text-neutral-600 dark:text-neutral-400">
          Reset local archive database back to initial confirmed specification baseline (Boxes D41 & D42 with clean test records).
        </p>

        <button
          onClick={() => {
            if (confirm('Are you sure you want to reset all operational projects and boxes to the specification initial baseline?')) {
              resetToSampleData();
              setFeedback('Archive database reset to clean confirmed specification baseline.');
              setTimeout(() => setFeedback(null), 3000);
            }
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Clean Specification Baseline</span>
        </button>
      </div>
    </div>
  );
};
