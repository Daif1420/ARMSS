import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  Project,
  Box,
  SystemSettings,
  UserProfile,
  ImportBatch,
  AuditLog,
  ProjectStatus,
  ImportItemReview,
} from '../types';
import {
  DEFAULT_SETTINGS,
  INITIAL_USERS,
  INITIAL_BOXES,
  generateInitialProjects,
  INITIAL_AUDIT_LOGS,
} from '../data/initialData';

interface BoxStats {
  box_number: string;
  total_projects: number;
  completed_projects: number;
  missing_projects: number;
  delivered_projects: number;
  pending_projects: number;
  in_progress_projects: number;
  remaining_projects: number;
  progress_pct: number;
  dossier_count: number;
  status: Box['status'];
  can_close: boolean;
  blocking_reasons: string[];
}

interface SourceVolumeKpis {
  total_projects: number;
  total_documents: number;
  total_sheets: number;
  total_boxes: number;
}

interface ArchiveKpis {
  archived_projects: number;
  archived_documents: number;
  archived_sheets: number;
  archived_boxes: number;
  archived_dossiers: number;
  missing_projects: number;
  completed_projects: number;
  delivered_projects: number;
  pending_projects: number;
  new_projects: number;
  open_boxes: number;
  in_progress_boxes: number;
  completed_boxes: number;
  closed_boxes: number;
  ready_for_delivery: number;
}

interface ArchiveContextType {
  projects: Project[];
  boxes: Box[];
  settings: SystemSettings;
  users: UserProfile[];
  currentUser: UserProfile;
  importBatches: ImportBatch[];
  auditLogs: AuditLog[];
  theme: 'light' | 'dark';
  allocateProject: (jobId: number) => { box_number: string; dossier_number: number; position: number; dossier_position: number } | null;
  updateProjectStatus: (jobId: number, status: ProjectStatus, reason?: string) => { success: boolean; error?: string };
  deliverProject: (jobId: number, recipient: string, notes?: string) => { success: boolean; error?: string };
  deliverBox: (boxNumber: string, recipient: string, notes?: string) => { success: boolean; count: number };
  closeBox: (boxNumber: string, reason?: string, isOverride?: boolean) => { success: boolean; error?: string };
  reopenBox: (boxNumber: string, reason: string) => { success: boolean; error?: string };
  commitImportBatch: (filename: string, items: ImportItemReview[]) => { success: boolean; inserted: number; updated: number };
  resolveConflict: (jobId: number, acceptUploaded: boolean, updatedData?: Partial<Project>) => void;
  updateSettings: (newSettings: Partial<SystemSettings>) => void;
  switchUser: (username: string) => void;
  toggleTheme: () => void;
  getBoxStats: (boxNumber: string) => BoxStats;
  getSourceVolumeKpis: () => SourceVolumeKpis;
  getArchiveKpis: () => ArchiveKpis;
  resetToSampleData: () => void;
  logAudit: (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => void;
}

const ArchiveContext = createContext<ArchiveContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROJECTS: 'arms_projects_v1',
  BOXES: 'arms_boxes_v1',
  SETTINGS: 'arms_settings_v1',
  USERS: 'arms_users_v1',
  CURRENT_USER: 'arms_current_user_v1',
  BATCHES: 'arms_batches_v1',
  AUDIT: 'arms_audit_logs_v1',
  THEME: 'arms_theme_v1',
};

export const ArchiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [boxes, setBoxes] = useState<Box[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOXES);
      return saved ? JSON.parse(saved) : INITIAL_BOXES;
    } catch {
      return INITIAL_BOXES;
    }
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return saved ? JSON.parse(saved) : generateInitialProjects();
    } catch {
      return generateInitialProjects();
    }
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      return saved ? JSON.parse(saved) : INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (saved) return JSON.parse(saved);
      return INITIAL_USERS[0];
    } catch {
      return INITIAL_USERS[0];
    }
  });

  const [importBatches, setImportBatches] = useState<ImportBatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BATCHES);
      return saved
        ? JSON.parse(saved)
        : [
            {
              id: 'BATCH-2026-001',
              filename: 'بيانات المشاريع.xlsx',
              imported_at: '2026-10-22 11:30',
              imported_by: 'System Manager',
              total_rows: 71,
              new_count: 71,
              existing_count: 0,
              changed_count: 0,
              duplicate_count: 0,
              error_count: 0,
              status: 'Completed',
            },
          ];
    } catch {
      return [];
    }
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUDIT);
      return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Sync theme with document element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(boxes));
  }, [boxes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(importBatches));
  }, [importBatches]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AUDIT, JSON.stringify(auditLogs));
  }, [auditLogs]);

  const logAudit = (log: Omit<AuditLog, 'id' | 'timestamp' | 'actor'>) => {
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actor: currentUser.full_name,
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  /**
   * Deterministic allocation based on configured box ranges
   * D41: 35150–35449, D42: 35500–35799
   * Each box has 6 dossiers of 50 projects
   */
  const allocateProject = (jobId: number) => {
    for (const range of settings.box_ranges) {
      if (jobId >= range.start_project && jobId <= range.end_project) {
        const relativePos = jobId - range.start_project + 1; // 1 to 300
        const dossierNum = Math.floor((relativePos - 1) / settings.projects_per_dossier) + 1;
        const dossierPos = ((relativePos - 1) % settings.projects_per_dossier) + 1;
        return {
          box_number: range.box_number,
          dossier_number: dossierNum,
          position: relativePos,
          dossier_position: dossierPos,
        };
      }
    }
    // If not matching any registered range, do not silently invent
    return null;
  };

  const updateProjectStatus = (jobId: number, newStatus: ProjectStatus, reason?: string) => {
    if (currentUser.role === 'User' && newStatus === 'Delivered') {
      return { success: false, error: 'Standard users cannot directly mark projects as Delivered' };
    }

    let oldStatus: ProjectStatus | undefined;
    setProjects(prev =>
      prev.map(p => {
        if (p.job_id === jobId) {
          oldStatus = p.archive_status;
          return {
            ...p,
            archive_status: newStatus,
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return p;
      })
    );

    if (oldStatus) {
      logAudit({
        action: 'STATUS_CHANGE',
        entity_type: 'PROJECT',
        entity_id: String(jobId),
        old_value: oldStatus,
        new_value: newStatus,
        reason: reason || `Status updated to ${newStatus} by ${currentUser.full_name}`,
      });
    }

    return { success: true };
  };

  const deliverProject = (jobId: number, recipient: string, notes?: string) => {
    if (currentUser.role === 'User') {
      return { success: false, error: 'Permission denied: User cannot perform deliveries' };
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let oldStatus: string = '';

    setProjects(prev =>
      prev.map(p => {
        if (p.job_id === jobId) {
          oldStatus = p.archive_status;
          return {
            ...p,
            archive_status: 'Delivered',
            delivery_date: timestamp,
            delivery_recipient: recipient,
            delivery_by: currentUser.full_name,
            delivery_notes: notes,
            updated_at: timestamp,
          };
        }
        return p;
      })
    );

    logAudit({
      action: 'DELIVERY',
      entity_type: 'PROJECT',
      entity_id: String(jobId),
      old_value: oldStatus || 'Completed',
      new_value: 'Delivered',
      reason: `Delivered to: ${recipient}. Notes: ${notes || 'N/A'}`,
    });

    return { success: true };
  };

  const deliverBox = (boxNumber: string, recipient: string, notes?: string) => {
    if (currentUser.role === 'User') {
      return { success: false, count: 0 };
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let deliveredCount = 0;

    setProjects(prev =>
      prev.map(p => {
        if (p.box_number === boxNumber && (p.archive_status === 'Completed' || p.archive_status === 'Ready for Delivery')) {
          deliveredCount++;
          return {
            ...p,
            archive_status: 'Delivered',
            delivery_date: timestamp,
            delivery_recipient: recipient,
            delivery_by: currentUser.full_name,
            delivery_notes: notes,
            updated_at: timestamp,
          };
        }
        return p;
      })
    );

    logAudit({
      action: 'DELIVERY',
      entity_type: 'BOX',
      entity_id: boxNumber,
      new_value: `Delivered ${deliveredCount} projects in Box ${boxNumber}`,
      reason: `Box delivery to ${recipient}. ${notes || ''}`,
    });

    return { success: true, count: deliveredCount };
  };

  const closeBox = (boxNumber: string, reason?: string, isOverride = false) => {
    const stats = getBoxStats(boxNumber);

    if (!stats.can_close && !isOverride) {
      return {
        success: false,
        error: `Cannot close Box ${boxNumber}: ${stats.blocking_reasons.join(', ')}`,
      };
    }

    if (isOverride) {
      if (currentUser.role !== 'System Manager') {
        return {
          success: false,
          error: 'Permission denied: Only System Manager can override box closure rules.',
        };
      }
      if (!reason || reason.trim() === '') {
        return {
          success: false,
          error: 'A mandatory override reason must be provided for manual closure.',
        };
      }
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setBoxes(prev =>
      prev.map(b => {
        if (b.box_number === boxNumber) {
          return {
            ...b,
            status: 'Closed',
            closed_at: timestamp,
            closed_by: currentUser.full_name,
            closure_reason: reason || 'Standard closure completed',
            is_override_closed: isOverride,
            override_reason: isOverride ? reason : undefined,
          };
        }
        return b;
      })
    );

    logAudit({
      action: isOverride ? 'BOX_OVERRIDE_CLOSE' : 'BOX_CLOSE',
      entity_type: 'BOX',
      entity_id: boxNumber,
      old_value: stats.status,
      new_value: 'Closed',
      reason: isOverride
        ? `System Manager Override Closure: ${reason}`
        : reason || 'Box closure verified with all projects accounted for',
    });

    return { success: true };
  };

  const reopenBox = (boxNumber: string, reason: string) => {
    if (currentUser.role !== 'System Manager') {
      return { success: false, error: 'Only System Manager can reopen closed boxes.' };
    }
    if (!reason || reason.trim() === '') {
      return { success: false, error: 'A mandatory reason is required to reopen a closed box.' };
    }

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    setBoxes(prev =>
      prev.map(b => {
        if (b.box_number === boxNumber) {
          return {
            ...b,
            status: 'In Progress',
            reopened_at: timestamp,
            reopen_reason: reason,
          };
        }
        return b;
      })
    );

    logAudit({
      action: 'BOX_REOPEN',
      entity_type: 'BOX',
      entity_id: boxNumber,
      old_value: 'Closed',
      new_value: 'In Progress',
      reason: `Box reopened: ${reason}`,
    });

    return { success: true };
  };

  const commitImportBatch = (filename: string, items: ImportItemReview[]) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let insertedCount = 0;
    let updatedCount = 0;

    const existingMap = new Map<number, Project>();
    for (const p of projects) {
      existingMap.set(p.job_id, p);
    }

    const newProjectList: Project[] = [...projects];

    for (const item of items) {
      if (item.category === 'error' || item.category === 'duplicate') continue;

      const allocation = allocateProject(item.job_id);
      const boxNum = allocation ? allocation.box_number : 'Unassigned';
      const dossierNum = allocation ? allocation.dossier_number : 1;
      const pos = allocation ? allocation.position : 0;
      const dossierPos = allocation ? allocation.dossier_position : 0;

      if (item.category === 'new') {
        const newProj: Project = {
          job_id: item.job_id,
          job_name: item.job_name,
          branch_name: item.branch_name,
          total_box: item.total_box,
          total_document: item.total_document,
          total_sheets: item.total_sheets,
          date_print: item.date_print,
          archive_status: 'Pending',
          box_number: boxNum,
          dossier_number: dossierNum,
          position: pos,
          dossier_position: dossierPos,
          created_at: timestamp,
          updated_at: timestamp,
        };
        newProjectList.push(newProj);
        insertedCount++;
      } else if (item.category === 'changed') {
        // Update existing record, BUT preserve current archive status and box assignment!
        const existingIdx = newProjectList.findIndex(p => p.job_id === item.job_id);
        if (existingIdx !== -1) {
          const current = newProjectList[existingIdx];
          newProjectList[existingIdx] = {
            ...current,
            job_name: item.job_name,
            branch_name: item.branch_name,
            total_box: item.total_box,
            total_document: item.total_document,
            total_sheets: item.total_sheets,
            date_print: item.date_print,
            is_changed_flag: false, // marked resolved upon commit
            updated_at: timestamp,
          };
          updatedCount++;
        }
      }
    }

    setProjects(newProjectList);

    // Save batch record
    const batchId = `BATCH-${new Date().getFullYear()}-${String(importBatches.length + 1).padStart(3, '0')}`;
    const batchRecord: ImportBatch = {
      id: batchId,
      filename,
      imported_at: timestamp,
      imported_by: currentUser.full_name,
      total_rows: items.length,
      new_count: insertedCount,
      existing_count: items.filter(i => i.category === 'existing').length,
      changed_count: updatedCount,
      duplicate_count: items.filter(i => i.category === 'duplicate').length,
      error_count: items.filter(i => i.category === 'error').length,
      status: 'Completed',
    };
    setImportBatches(prev => [batchRecord, ...prev]);

    logAudit({
      action: 'IMPORT',
      entity_type: 'IMPORT',
      entity_id: batchId,
      new_value: `Imported ${items.length} rows (${insertedCount} new, ${updatedCount} updated)`,
      reason: `Excel workbook ${filename} imported by ${currentUser.full_name}`,
    });

    return { success: true, inserted: insertedCount, updated: updatedCount };
  };

  const resolveConflict = (jobId: number, acceptUploaded: boolean, updatedData?: Partial<Project>) => {
    setProjects(prev =>
      prev.map(p => {
        if (p.job_id === jobId) {
          return {
            ...p,
            ...(acceptUploaded && updatedData ? updatedData : {}),
            is_changed_flag: false,
            change_notes: acceptUploaded ? 'Uploaded changes accepted' : 'Stored values preserved',
            updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
          };
        }
        return p;
      })
    );

    logAudit({
      action: 'CONFLICT_RESOLVE',
      entity_type: 'PROJECT',
      entity_id: String(jobId),
      new_value: acceptUploaded ? 'Accepted uploaded changes' : 'Kept stored values',
      reason: 'Conflict resolved in review modal',
    });
  };

  const updateSettings = (newSettings: Partial<SystemSettings>) => {
    setSettings(prev => {
      const merged = { ...prev, ...newSettings };
      return merged;
    });

    logAudit({
      action: 'SETTINGS_UPDATE',
      entity_type: 'SETTINGS',
      entity_id: 'SYSTEM',
      new_value: JSON.stringify(newSettings),
      reason: 'System settings updated',
    });
  };

  const switchUser = (username: string) => {
    const user = users.find(u => u.username === username);
    if (user) {
      setCurrentUser(user);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const getBoxStats = (boxNumber: string): BoxStats => {
    const box = boxes.find(b => b.box_number === boxNumber);
    const boxProjects = projects.filter(p => p.box_number === boxNumber);

    const total = boxProjects.length;
    const completed = boxProjects.filter(p => p.archive_status === 'Completed').length;
    const missing = boxProjects.filter(p => p.archive_status === 'Missing').length;
    const delivered = boxProjects.filter(p => p.archive_status === 'Delivered').length;
    const pending = boxProjects.filter(p => p.archive_status === 'Pending').length;
    const inProgress = boxProjects.filter(p => p.archive_status === 'In Progress').length;
    const onHold = boxProjects.filter(p => p.archive_status === 'On Hold').length;

    const remaining = total - (completed + delivered);
    const progressPct = total > 0 ? Math.round(((completed + delivered) / total) * 100) : 0;

    const blockingReasons: string[] = [];
    if (pending > 0) blockingReasons.push(`${pending} projects are still Pending`);
    if (inProgress > 0) blockingReasons.push(`${inProgress} projects are still In Progress`);
    if (missing > 0) blockingReasons.push(`${missing} projects are marked Missing`);
    if (onHold > 0) blockingReasons.push(`${onHold} projects are On Hold`);
    if (total === 0) blockingReasons.push('No projects have been allocated to this box');

    const canClose = blockingReasons.length === 0 && (box?.status !== 'Closed');

    return {
      box_number: boxNumber,
      total_projects: total,
      completed_projects: completed,
      missing_projects: missing,
      delivered_projects: delivered,
      pending_projects: pending,
      in_progress_projects: inProgress,
      remaining_projects: remaining,
      progress_pct: progressPct,
      dossier_count: box?.dossier_count || 6,
      status: box?.status || 'Open',
      can_close: canClose,
      blocking_reasons: blockingReasons,
    };
  };

  // Group A: Source Project Volume KPIs (from source Excel data)
  const getSourceVolumeKpis = (): SourceVolumeKpis => {
    const totalProj = projects.length;
    const totalDoc = projects.reduce((acc, p) => acc + (p.total_document || 0), 0);
    const totalSheets = projects.reduce((acc, p) => acc + (p.total_sheets || 0), 0);
    const totalBoxes = projects.reduce((acc, p) => acc + (p.total_box || 0), 0);

    return {
      total_projects: totalProj,
      total_documents: totalDoc,
      total_sheets: totalSheets,
      total_boxes: totalBoxes,
    };
  };

  // Group B: Actual Archive KPIs (actual physical archival progress)
  const getArchiveKpis = (): ArchiveKpis => {
    const archivedProjects = projects.filter(p => p.archive_status === 'Completed' || p.archive_status === 'Delivered').length;
    const archivedDocs = projects
      .filter(p => p.archive_status === 'Completed' || p.archive_status === 'Delivered')
      .reduce((acc, p) => acc + (p.total_document || 0), 0);
    const archivedSheets = projects
      .filter(p => p.archive_status === 'Completed' || p.archive_status === 'Delivered')
      .reduce((acc, p) => acc + (p.total_sheets || 0), 0);

    const completedBoxes = boxes.filter(b => b.status === 'Completed').length;
    const closedBoxes = boxes.filter(b => b.status === 'Closed').length;
    const inProgressBoxes = boxes.filter(b => b.status === 'In Progress').length;
    const openBoxes = boxes.filter(b => b.status === 'Open').length;

    // Completed dossiers: dossiers where all projects are completed/delivered
    let archivedDossiers = 0;
    for (const b of boxes) {
      for (let d = 1; d <= b.dossier_count; d++) {
        const dossierProjects = projects.filter(p => p.box_number === b.box_number && p.dossier_number === d);
        if (
          dossierProjects.length > 0 &&
          dossierProjects.every(p => p.archive_status === 'Completed' || p.archive_status === 'Delivered')
        ) {
          archivedDossiers++;
        }
      }
    }

    return {
      archived_projects: archivedProjects,
      archived_documents: archivedDocs,
      archived_sheets: archivedSheets,
      archived_boxes: closedBoxes + completedBoxes,
      archived_dossiers: archivedDossiers,
      missing_projects: projects.filter(p => p.archive_status === 'Missing').length,
      completed_projects: projects.filter(p => p.archive_status === 'Completed').length,
      delivered_projects: projects.filter(p => p.archive_status === 'Delivered').length,
      pending_projects: projects.filter(p => p.archive_status === 'Pending').length,
      new_projects: projects.filter(p => p.created_at.startsWith('2026-10-30') || p.created_at.startsWith('2026-10-29')).length,
      open_boxes: openBoxes,
      in_progress_boxes: inProgressBoxes,
      completed_boxes: completedBoxes,
      closed_boxes: closedBoxes,
      ready_for_delivery: projects.filter(p => p.archive_status === 'Ready for Delivery').length,
    };
  };

  const resetToSampleData = () => {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.BOXES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.BATCHES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT);
    setProjects(generateInitialProjects());
    setBoxes(INITIAL_BOXES);
    setSettings(DEFAULT_SETTINGS);
    setAuditLogs(INITIAL_AUDIT_LOGS);
  };

  return (
    <ArchiveContext.Provider
      value={{
        projects,
        boxes,
        settings,
        users,
        currentUser,
        importBatches,
        auditLogs,
        theme,
        allocateProject,
        updateProjectStatus,
        deliverProject,
        deliverBox,
        closeBox,
        reopenBox,
        commitImportBatch,
        resolveConflict,
        updateSettings,
        switchUser,
        toggleTheme,
        getBoxStats,
        getSourceVolumeKpis,
        getArchiveKpis,
        resetToSampleData,
        logAudit,
      }}
    >
      {children}
    </ArchiveContext.Provider>
  );
};

export const useArchive = () => {
  const context = useContext(ArchiveContext);
  if (!context) {
    throw new Error('useArchive must be used within an ArchiveProvider');
  }
  return context;
};
