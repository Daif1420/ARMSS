import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  History,
  Lock,
  Search,
  ShieldCheck,
  Tag,
  User,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuditLog } from '../../types';
import { exportToXlsx } from '../../utils/excelParser';

export const AuditLogsView: React.FC = () => {
  const { auditLogs } = useApp();

  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const matchesSearch =
        search === '' ||
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase()) ||
        log.entity_id.toLowerCase().includes(search.toLowerCase()) ||
        log.reason?.toLowerCase().includes(search.toLowerCase());

      const matchesAction = selectedAction === 'all' || log.action === selectedAction;
      const matchesEntity = selectedEntityType === 'all' || log.entity_type === selectedEntityType;

      return matchesSearch && matchesAction && matchesEntity;
    });
  }, [auditLogs, search, selectedAction, selectedEntityType]);

  const uniqueActions = useMemo(() => {
    return Array.from(new Set(auditLogs.map((l) => l.action)));
  }, [auditLogs]);

  const handleExport = () => {
    const data = filteredLogs.map((l) => ({
      Timestamp: l.timestamp,
      Actor: l.actor,
      Role: l.actor_role,
      Action: l.action,
      'Entity Type': l.entity_type,
      'Entity ID': l.entity_id,
      Details: l.details || '',
      Reason: l.reason || '',
    }));
    exportToXlsx(data, `ARMS_Audit_Logs_${new Date().toISOString().split('T')[0]}`);
  };

  const getActionBadgeStyle = (action: string) => {
    if (action.includes('OVERRIDE')) return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    if (action.includes('CLOSE')) return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    if (action.includes('DELIVERY')) return 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20';
    if (action.includes('IMPORT')) return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    if (action.includes('REOPEN')) return 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20';
    return 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#007AFF]" />
            <span>Central Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable compliance event log tracking status updates, closures, manager overrides, and deliveries (§11).
          </p>
        </div>

        <button
          onClick={handleExport}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Download className="w-3.5 h-3.5 text-[#007AFF]" />
          <span>Export Audit Log ({filteredLogs.length})</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search actor, reason, details, ID..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            />
          </div>

          {/* Action Filter */}
          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="all">All Event Actions</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>

          {/* Entity Type Filter */}
          <div>
            <select
              value={selectedEntityType}
              onChange={(e) => setSelectedEntityType(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
            >
              <option value="all">All Entity Types</option>
              <option value="project">Project</option>
              <option value="box">Box</option>
              <option value="import_batch">Import Batch</option>
              <option value="label">Label</option>
              <option value="setting">Setting</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 dark:border-white/10 bg-slate-50/75 dark:bg-white/[0.02] text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Details & Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No audit records found matching the query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.actor}
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {log.actor_role}
                      </span>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadgeStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400 capitalize">{log.entity_type}</span>{' '}
                      <strong>#{log.entity_id}</strong>
                    </td>
                    <td className="py-3 px-4 text-slate-700 dark:text-slate-200">
                      <div>{log.details}</div>
                      {log.reason && (
                        <div className="mt-1 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-lg text-amber-800 dark:text-amber-300 font-mono text-[11px]">
                          <strong>Mandatory Reason / Justification:</strong> {log.reason}
                        </div>
                      )}
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
