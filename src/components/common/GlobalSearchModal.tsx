import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Box as BoxIcon, FileText, FolderArchive, Layers, Search, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusBadge } from './Badge';

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchModalOpen,
    setIsSearchModalOpen,
    projects,
    boxes,
    navigateToBox,
    setSelectedJobIdForDetail,
  } = useApp();

  const [query, setQuery] = useState('');

  // Keyboard shortcut Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(!isSearchModalOpen);
      } else if (e.key === 'Escape' && isSearchModalOpen) {
        setIsSearchModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchModalOpen, setIsSearchModalOpen]);

  // Reset query on open
  useEffect(() => {
    if (isSearchModalOpen) {
      setQuery('');
    }
  }, [isSearchModalOpen]);

  const searchResults = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return { matchedProjects: [], matchedBoxes: [] };

    // Search Projects by Job ID, Job Name, Branch Name, Box, Dossier
    const matchedProjects = projects.filter((p) => {
      return (
        String(p.job_id).includes(trimmed) ||
        p.job_name.toLowerCase().includes(trimmed) ||
        p.branch_name.toLowerCase().includes(trimmed) ||
        p.box_number.toLowerCase().includes(trimmed) ||
        `dossier ${p.dossier_number}`.includes(trimmed) ||
        `d${p.dossier_number}`.includes(trimmed)
      );
    }).slice(0, 15);

    // Search Boxes
    const matchedBoxes = boxes.filter((b) => {
      return (
        b.box_number.toLowerCase().includes(trimmed) ||
        (trimmed.length > 2 && `${b.first_project} ${b.last_project}`.includes(trimmed))
      );
    });

    return { matchedProjects, matchedBoxes };
  }, [query, projects, boxes]);

  if (!isSearchModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-100">
      <div
        className="w-full max-w-2xl bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden transform transition-all"
        role="dialog"
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-white/10">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Job ID, Project Name, Branch, Box Number (e.g. D41), or Dossier..."
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
            autoFocus
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-500">
              ESC
            </span>
          )}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-white/5 p-2">
          {!query.trim() && (
            <div className="p-8 text-center text-xs text-slate-400">
              <FolderArchive className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              <span>Search across Intercom Archive: Job IDs (e.g. 35150), Box (D41, D42), Branches, or Dossiers.</span>
            </div>
          )}

          {query.trim() && searchResults.matchedBoxes.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <BoxIcon className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>Archive Boxes</span>
              </div>
              {searchResults.matchedBoxes.map((box) => (
                <div
                  key={box.box_number}
                  onClick={() => {
                    navigateToBox(box.box_number);
                    setIsSearchModalOpen(false);
                  }}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#007AFF]/10 text-[#007AFF] flex items-center justify-center font-bold text-xs">
                      {box.box_number}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>Box {box.box_number}</span>
                        <span className="text-slate-400 font-normal">
                          (Projects {box.first_project} – {box.last_project})
                        </span>
                      </div>
                      {/* Standard hierarchy path */}
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                        <span>Archive</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                        <span className="font-semibold text-[#007AFF]">{box.box_number}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                        <span>6 Dossiers ({box.capacity} capacity)</span>
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={box.status} />
                </div>
              ))}
            </div>
          )}

          {query.trim() && searchResults.matchedProjects.length > 0 && (
            <div className="py-2">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#007AFF]" />
                <span>Project Records ({searchResults.matchedProjects.length})</span>
              </div>
              {searchResults.matchedProjects.map((project) => (
                <div
                  key={project.job_id}
                  onClick={() => {
                    setSelectedJobIdForDetail(project.job_id);
                    setIsSearchModalOpen(false);
                  }}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer flex items-center justify-between transition-colors"
                >
                  <div className="min-w-0 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#007AFF]">
                        #{project.job_id}
                      </span>
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-100 truncate max-w-sm">
                        {project.job_name}
                      </span>
                    </div>

                    {/* Standard archive hierarchy: Archive → Box → Dossier → Project */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                      <span className="text-slate-400">{project.branch_name}</span>
                      <span>·</span>
                      <div className="flex items-center gap-1 font-mono text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded">
                        <span>Archive</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                        <span className="font-semibold text-[#007AFF]">{project.box_number}</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                        <span>Dossier {project.dossier_number}</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-50" />
                        <span className="font-medium">Pos #{project.archive_position}</span>
                      </div>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <StatusBadge status={project.status} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {query.trim() &&
            searchResults.matchedProjects.length === 0 &&
            searchResults.matchedBoxes.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No matching projects or boxes found for "{query}".
              </div>
            )}
        </div>
      </div>
    </div>
  );
};
