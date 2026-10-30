import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FolderTree, ChevronRight } from 'lucide-react';
import { useArchive } from '../context/ArchiveContext';
import { Project } from '../types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: Project) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onSelectProject,
}) => {
  const { projects } = useArchive();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  // Keyboard shortcut Cmd+K or /
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const trimmed = query.trim().toLowerCase();
  const results = trimmed
    ? projects.filter(p => {
        const idMatch = String(p.job_id).includes(trimmed);
        const nameMatch = p.job_name.toLowerCase().includes(trimmed);
        const branchMatch = p.branch_name.toLowerCase().includes(trimmed);
        const boxMatch = p.box_number.toLowerCase().includes(trimmed);
        const dossierMatch = `dossier ${p.dossier_number}`.includes(trimmed) || `d${p.dossier_number}` === trimmed;
        return idMatch || nameMatch || branchMatch || boxMatch || dossierMatch;
      }).slice(0, 15)
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4 bg-black/40 backdrop-blur-xs">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-neutral-200 dark:border-neutral-800 gap-3">
          <Search className="w-5 h-5 text-[#007AFF] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by Job ID (e.g. 35150), Project Name, Branch, Box (D41), or Dossier..."
            className="w-full bg-transparent text-sm text-[#1D1D1F] dark:text-[#F5F5F7] placeholder-neutral-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60 p-2">
          {query.trim() === '' ? (
            <div className="py-12 text-center text-xs text-[#86868B] dark:text-[#98989D]">
              <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-40 text-[#007AFF]" />
              Type a Job ID or project keyword to locate its archive box and dossier
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#86868B] dark:text-[#98989D]">
              No archive records found matching &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map(proj => (
              <button
                key={proj.job_id}
                onClick={() => {
                  onSelectProject(proj);
                  onClose();
                }}
                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-neutral-100/80 dark:hover:bg-neutral-800/60 transition-colors flex items-center justify-between group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[#007AFF] bg-[#007AFF]/10 dark:bg-[#007AFF]/20 px-1.5 py-0.5 rounded">
                      #{proj.job_id}
                    </span>
                    <span className="text-sm font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                      {proj.job_name}
                    </span>
                  </div>
                  {/* Specified Archive Hierarchy: Archive → Box → Dossier → Project */}
                  <div className="flex items-center gap-1.5 text-xs text-[#86868B] dark:text-[#98989D]">
                    <span>Archive</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                    <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Box {proj.box_number}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                    <span className="font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">Dossier {proj.dossier_number}</span>
                    <ChevronRight className="w-3 h-3 opacity-60" />
                    <span>Pos #{proj.dossier_position}</span>
                    <span className="mx-1">·</span>
                    <span>{proj.branch_name}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${
                      proj.archive_status === 'Completed'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : proj.archive_status === 'Delivered'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                        : proj.archive_status === 'Missing'
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300'
                    }`}
                  >
                    {proj.archive_status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#007AFF] transition-colors" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
