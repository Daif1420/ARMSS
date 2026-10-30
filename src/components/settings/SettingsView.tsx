import React, { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  Check,
  CheckCircle2,
  Database,
  Download,
  Plus,
  RefreshCw,
  Save,
  Settings as SettingsIcon,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AllocationRangeConfig, SystemSettings } from '../../types';
import { ConfirmModal } from '../common/ConfirmModal';

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetAllData, projects, boxes } = useApp();

  const [formData, setFormData] = useState<SystemSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // New allocation range inputs
  const [newBoxName, setNewBoxName] = useState('');
  const [newFirstProj, setNewFirstProj] = useState<number>(35800);
  const [newLastProj, setNewLastProj] = useState<number>(36099);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddRange = () => {
    if (!newBoxName) return;
    const capacity = Math.max(1, newLastProj - newFirstProj + 1);
    const newRange: AllocationRangeConfig = {
      box: newBoxName.trim().toUpperCase(),
      first_project: newFirstProj,
      last_project: newLastProj,
      capacity,
    };
    const updatedRanges = [...formData.allocation_ranges, newRange];
    setFormData({ ...formData, allocation_ranges: updatedRanges });
    setNewBoxName('');
  };

  const handleRemoveRange = (boxName: string) => {
    const updated = formData.allocation_ranges.filter((r) => r.box !== boxName);
    setFormData({ ...formData, allocation_ranges: updated });
  };

  const handleExportBackup = () => {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      settings: formData,
      boxes,
      projects,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ARMS_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-[#007AFF]" />
            <span>System Settings & Allocation Configuration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure archive allocation boundaries, capacity parameters, delivery rules, and backup (§2 & §14).
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#34C759]/10 text-[#34C759] text-xs font-semibold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            <span>Settings Saved Successfully</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* ============================================================== */}
        {/* SECTION 1: ALLOCATION RANGES (D41, D42, ETC.) */}
        {/* ============================================================== */}
        <div className="p-6 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Archive className="w-4 h-4 text-[#007AFF]" />
                <span>Confirmed Archive Allocation Ranges (§2)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each standard box holds 300 projects divided across 6 dossiers (50 projects/dossier).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase">
                  <th className="py-2.5 px-4">Box</th>
                  <th className="py-2.5 px-4">First Project</th>
                  <th className="py-2.5 px-4">Last Project</th>
                  <th className="py-2.5 px-4">Capacity</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5 font-mono text-xs">
                {formData.allocation_ranges.map((r) => (
                  <tr key={r.box} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-2.5 px-4 font-bold text-[#007AFF] font-sans">
                      Box {r.box}
                    </td>
                    <td className="py-2.5 px-4 font-semibold">{r.first_project}</td>
                    <td className="py-2.5 px-4 font-semibold">{r.last_project}</td>
                    <td className="py-2.5 px-4">{r.capacity} projects</td>
                    <td className="py-2.5 px-4 text-right">
                      {r.box !== 'D41' && r.box !== 'D42' ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveRange(r.box)}
                          className="text-[#FF3B30] hover:opacity-80 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-sans uppercase">
                          Confirmed Base
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Approved Box Range */}
          <div className="p-4 bg-slate-50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-xl space-y-2">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
              Register New Approved Box Range
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <input
                type="text"
                placeholder="Box (e.g. D43)"
                value={newBoxName}
                onChange={(e) => setNewBoxName(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white"
              />
              <input
                type="number"
                placeholder="First Project"
                value={newFirstProj}
                onChange={(e) => setNewFirstProj(parseInt(e.target.value, 10) || 0)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white font-mono"
              />
              <input
                type="number"
                placeholder="Last Project"
                value={newLastProj}
                onChange={(e) => setNewLastProj(parseInt(e.target.value, 10) || 0)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddRange}
                className="px-3 py-1.5 font-semibold rounded-lg bg-[#007AFF] text-white hover:bg-[#0066D6] flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Range</span>
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 2: OPERATIONAL RULES & AGGREGATIONS */}
        {/* ============================================================== */}
        <div className="p-6 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-5">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Operational Calculations & Workflow Rules
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Source Total Box Aggregation */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
              <label className="font-semibold text-slate-800 dark:text-white block">
                Source `Total Box` Aggregation Rule
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Defines how the dashboard calculates the source project volume for boxes.
              </p>
              <select
                value={formData.total_box_aggregation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_box_aggregation: e.target.value as 'sum' | 'count_distinct',
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white"
              >
                <option value="sum">Sum of row `Total Box` values</option>
                <option value="count_distinct">Distinct count of assigned boxes</option>
              </select>
            </div>

            {/* Delivery Scope */}
            <div className="space-y-1.5 p-3.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02]">
              <label className="font-semibold text-slate-800 dark:text-white block">
                Delivery Execution Scope
              </label>
              <p className="text-[11px] text-slate-500 mb-2">
                Allow handovers by individual project, by complete box, or both.
              </p>
              <select
                value={formData.delivery_scope}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    delivery_scope: e.target.value as 'both' | 'project_only' | 'box_only',
                  })
                }
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 text-slate-900 dark:text-white"
              >
                <option value="both">Both Individual Project & Complete Box Delivery</option>
                <option value="project_only">Individual Project Delivery Only</option>
                <option value="box_only">Complete Box Delivery Only</option>
              </select>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#007AFF] hover:bg-[#0066D6] text-white shadow-sm flex items-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save System Configuration</span>
          </button>
        </div>
      </form>

      {/* ============================================================== */}
      {/* SECTION 3: DATA MANAGEMENT & BACKUP */}
      {/* ============================================================== */}
      <div className="p-6 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Database className="w-4 h-4 text-[#007AFF]" />
          <span>Database & Backup Management</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-800 dark:text-white block">
                Export System Backup JSON
              </span>
              <span className="text-[11px] text-slate-500">
                Full snapshot of projects, boxes, and settings.
              </span>
            </div>
            <button
              onClick={handleExportBackup}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#2C2C2E] border border-slate-200 dark:border-white/10 font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Backup</span>
            </button>
          </div>

          <div className="p-4 rounded-xl border border-[#FF3B30]/20 bg-[#FF3B30]/[0.02] flex items-center justify-between">
            <div>
              <span className="font-bold text-[#FF3B30] block">
                Reset to Initial Seed State
              </span>
              <span className="text-[11px] text-slate-500">
                Restores default confirmed D41 & D42 Intercom datasets.
              </span>
            </div>
            <button
              onClick={() => setIsResetModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#FF3B30] text-white font-semibold hover:bg-[#D70015] flex items-center gap-1.5 shadow-sm"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetModalOpen && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setIsResetModalOpen(false)}
          isDestructive={true}
          title="Reset All Archive Data"
          description="Are you sure you want to reset the system database? This will revert all projects, boxes, and audit logs to the initial confirmed D41 and D42 operational baseline."
          confirmLabel="Reset All Data"
          onConfirm={() => {
            resetAllData();
            setIsResetModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
