import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  ArrowUpDown,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { exportToExcel } from '../utils/excel';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useArchive();
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [sortAsc, setSortAsc] = useState(false); // default newest first

  const actionTypes = [
    'IMPORT',
    'STATUS_CHANGE',
    'DELIVERY',
    'BOX_CLOSE',
    'BOX_OVERRIDE_CLOSE',
    'BOX_REOPEN',
    'LABEL_GENERATE',
    'CONFLICT_RESOLVE',
    'SETTINGS_UPDATE',
  ];

  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter(l => {
        const matchesSearch =
          l.actor.toLowerCase().includes(search.toLowerCase()) ||
          l.entity_id.toLowerCase().includes(search.toLowerCase()) ||
          (l.reason && l.reason.toLowerCase().includes(search.toLowerCase())) ||
          (l.new_value && l.new_value.toLowerCase().includes(search.toLowerCase()));
        const matchesAction = selectedAction === 'all' || l.action === selectedAction;
        return matchesSearch && matchesAction;
      })
      .sort((a, b) => {
        const cmp = a.timestamp.localeCompare(b.timestamp);
        return sortAsc ? cmp : -cmp;
      });
  }, [auditLogs, search, selectedAction, sortAsc]);

  const handleExport = () => {
    exportToExcel(
      filteredLogs.map(l => ({
        'Log ID': l.id,
        'Timestamp': l.timestamp,
        'Operator': l.actor,
        'Action': l.action,
        'Entity Type': l.entity_type,
        'Entity ID': l.entity_id,
        'Old Value': l.old_value || '',
        'New Value': l.new_value || '',
        'Reason / Notes': l.reason || '',
      })),
      `ARMS_Audit_Logs_${new Date().toISOString().split('T')[0]}`
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#007AFF]" />
            <span>Central Archive Audit Trail</span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
            Immutable system logs tracking deliveries, box closures, manager overrides, status changes, and settings updates
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 transition-colors shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Export Audit Trail ({filteredLogs.length})</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#1C1C1E] rounded-xl border border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by operator, entity ID, or reason..."
            className="w-full text-xs bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-neutral-500">
            <Filter className="w-3.5 h-3.5 text-neutral-400" />
            <span>Action:</span>
            <select
              value={selectedAction}
              onChange={e => setSelectedAction(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] px-2.5 py-1.5 rounded-lg text-xs border-none focus:outline-none cursor-pointer"
            >
              <option value="all">All Actions</option>
              {actionTypes.map(act => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortAsc ? 'Oldest First' : 'Newest First'}</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#18181B] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-neutral-50 dark:bg-neutral-900/90 text-[#86868B] dark:text-[#98989D] border-b border-neutral-200 dark:border-neutral-800 font-semibold select-none">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Operator</th>
                <th className="py-2.5 px-3">Action</th>
                <th className="py-2.5 px-3">Entity</th>
                <th className="py-2.5 px-3">Details / Value Change</th>
                <th className="py-2.5 px-3">Reason / Audit Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400">
                    No audit records matching criteria
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <td className="py-2.5 px-3 font-mono text-neutral-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#1D1D1F] dark:text-[#F5F5F7] whitespace-nowrap">
                      {log.actor}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.action === 'BOX_OVERRIDE_CLOSE'
                            ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold'
                            : log.action === 'DELIVERY'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : log.action === 'BOX_CLOSE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : log.action === 'BOX_REOPEN'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#007AFF] whitespace-nowrap">
                      {log.entity_type}: {log.entity_id}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-300 max-w-sm truncate">
                      {log.old_value ? (
                        <span>
                          <span className="line-through text-neutral-400 mr-1.5">{log.old_value}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">→ {log.new_value}</span>
                        </span>
                      ) : (
                        <span>{log.new_value}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-500 italic max-w-xs truncate">
                      {log.reason || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
