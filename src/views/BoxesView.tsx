import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  Filter,
  ArrowUpDown,
  Lock,
  Unlock,
  Printer,
  Truck,
  Eye,
  Plus,
} from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { Box } from '../types';

interface BoxesViewProps {
  onOpenBox: (b: Box) => void;
  onPrintBoxLabel: (boxNumber: string) => void;
  onDeliverBox: (boxNumber: string) => void;
}

type SortField = 'box_number' | 'project_count' | 'completed' | 'missing' | 'remaining' | 'progress' | 'status';

export const BoxesView: React.FC<BoxesViewProps> = ({
  onOpenBox,
  onPrintBoxLabel,
  onDeliverBox,
}) => {
  const { boxes, getBoxStats } = useArchive();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('box_number');
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const filteredBoxes = useMemo(() => {
    return boxes
      .filter(b => {
        const stats = getBoxStats(b.box_number);
        const matchesSearch =
          b.box_number.toLowerCase().includes(search.toLowerCase()) ||
          `${b.start_project}-${b.end_project}`.includes(search);
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const statsA = getBoxStats(a.box_number);
        const statsB = getBoxStats(b.box_number);

        let comparison = 0;
        if (sortField === 'box_number') {
          comparison = a.box_number.localeCompare(b.box_number, undefined, { numeric: true });
        } else if (sortField === 'project_count') {
          comparison = statsA.total_projects - statsB.total_projects;
        } else if (sortField === 'completed') {
          comparison = statsA.completed_projects - statsB.completed_projects;
        } else if (sortField === 'missing') {
          comparison = statsA.missing_projects - statsB.missing_projects;
        } else if (sortField === 'remaining') {
          comparison = statsA.remaining_projects - statsB.remaining_projects;
        } else if (sortField === 'progress') {
          comparison = statsA.progress_pct - statsB.progress_pct;
        } else if (sortField === 'status') {
          comparison = a.status.localeCompare(b.status);
        }

        return sortAsc ? comparison : -comparison;
      });
  }, [boxes, search, statusFilter, sortField, sortAsc, getBoxStats]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-[#F5F5F7] flex items-center gap-2">
            <Boxes className="w-5 h-5 text-[#007AFF]" />
            <span>Archive Boxes Management</span>
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#98989D] mt-0.5">
            Physical boxes allocated according to approved capacity rules (300 projects across 6 dossiers)
          </p>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-[#1C1C1E] rounded-xl border border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center gap-2 w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by Box (e.g. D41) or project range..."
            className="w-full text-xs bg-transparent text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <span className="text-xs text-neutral-400">Status:</span>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-neutral-100 dark:bg-neutral-800 text-[#1D1D1F] dark:text-[#F5F5F7] px-2.5 py-1.5 rounded-lg border-none focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Table: clicking anywhere on a box row opens its details */}
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden bg-white dark:bg-[#18181B] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-800 text-[#86868B] dark:text-[#98989D] font-semibold select-none">
              <tr>
                <th
                  onClick={() => handleSort('box_number')}
                  className="py-3 px-4 cursor-pointer hover:text-[#007AFF] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Box Number</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Dossier Count</th>
                <th
                  onClick={() => handleSort('project_count')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#007AFF] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Project Count</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('completed')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#007AFF] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Completed</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('missing')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#007AFF] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Missing</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remaining')}
                  className="py-3 px-4 text-right cursor-pointer hover:text-[#007AFF] transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Remaining</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('progress')}
                  className="py-3 px-4 cursor-pointer hover:text-[#007AFF] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Progress</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-3 px-4 cursor-pointer hover:text-[#007AFF] transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Box Status</span>
                    <ArrowUpDown className="w-3 h-3 opacity-60" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800/60">
              {filteredBoxes.map(b => {
                const stats = getBoxStats(b.box_number);
                return (
                  <tr
                    key={b.box_number}
                    onClick={() => onOpenBox(b)}
                    className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#007AFF] group-hover:underline">
                          Box {b.box_number}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          (#{b.start_project}–#{b.end_project})
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono tabular-nums text-neutral-600 dark:text-neutral-400">
                      {b.dossier_count}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium tabular-nums text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {stats.total_projects} / {b.capacity}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                      {stats.completed_projects + stats.delivered_projects}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-rose-600 dark:text-rose-400 font-bold">
                      {stats.missing_projects}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-amber-600 dark:text-amber-400">
                      {stats.remaining_projects}
                    </td>
                    <td className="py-3 px-4 w-44">
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#007AFF] h-full rounded-full"
                            style={{ width: `${stats.progress_pct}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] font-bold tabular-nums text-neutral-600 dark:text-neutral-300 w-9 text-right">
                          {stats.progress_pct}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                          b.status === 'Closed'
                            ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                            : b.status === 'Completed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                        }`}
                      >
                        {b.status}
                        {b.is_override_closed && ' (Override)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onPrintBoxLabel(b.box_number)}
                          className="p-1.5 text-neutral-400 hover:text-[#007AFF] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Print Box Label"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeliverBox(b.box_number)}
                          className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Deliver Completed in Box"
                        >
                          <Truck className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenBox(b)}
                          className="p-1.5 text-neutral-400 hover:text-[#1D1D1F] dark:hover:text-[#F5F5F7] hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded transition-colors"
                          title="Open Box Dossiers"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
