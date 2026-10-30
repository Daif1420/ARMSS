import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  AuditLog,
  Box,
  ImportBatch,
  ImportConflict,
  Project,
  ProjectStatus,
  SystemSettings,
  User,
  UserRole,
} from '../types';
import { evaluateBoxClosure, getAllocationForJobId } from '../utils/allocation';
import { exportToXlsx, ParsedRowResult, ParseWorkbookResult } from '../utils/excelParser';
import { storage } from '../utils/storage';

export type NavigationTab =
  | 'dashboard'
  | 'boxes'
  | 'projects'
  | 'reports'
  | 'import'
  | 'labels'
  | 'users'
  | 'settings'
  | 'audit';

interface AppContextType {
  // Navigation & State
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  selectedBoxNumber: string | null;
  setSelectedBoxNumber: (box: string | null) => void;
  selectedDossierNumber: number | null;
  setSelectedDossierNumber: (dossier: number | null) => void;
  selectedJobIdForDetail: number | null;
  setSelectedJobIdForDetail: (jobId: number | null) => void;
  navigateToBox: (boxNumber: string, dossierNumber?: number) => void;
  navigateToProjectsWithFilter: (filter: { box?: string; dossier?: number; status?: ProjectStatus; search?: string }) => void;
  projectFilterState: { box?: string; dossier?: number; status?: ProjectStatus; search?: string };
  setProjectFilterState: React.Dispatch<React.SetStateAction<{ box?: string; dossier?: number; status?: ProjectStatus; search?: string }>>;

  // Data
  projects: Project[];
  boxes: Box[];
  users: User[];
  currentUser: User;
  auditLogs: AuditLog[];
  importBatches: ImportBatch[];
  settings: SystemSettings;
  theme: 'light' | 'dark';

  // Permissions helper
  hasPermission: (action: 'manage_users' | 'manage_settings' | 'upload_data' | 'override_closure' | 'reopen_box' | 'deliver' | 'generate_labels') => boolean;

  // Actions
  switchUser: (userId: string) => void;
  toggleTheme: () => void;
  updateProjectStatus: (jobId: number, status: ProjectStatus, reason?: string) => { success: boolean; error?: string };
  deliverProject: (jobId: number, recipient?: string, notes?: string) => { success: boolean; error?: string };
  batchDeliverProjects: (jobIds: number[], recipient?: string, notes?: string) => { success: boolean; count: number };
  deliverBox: (boxNumber: string, recipient?: string, notes?: string) => { success: boolean; error?: string };
  closeBox: (boxNumber: string, isOverride: boolean, reason?: string) => { success: boolean; error?: string };
  reopenBox: (boxNumber: string, reason: string) => { success: boolean; error?: string };
  commitImportBatch: (
    parseResult: ParseWorkbookResult,
    conflictResolutions: Map<string, 'use_incoming' | 'keep_existing' | 'skip'>
  ) => { success: boolean; message: string };
  updateSettings: (newSettings: SystemSettings) => void;
  resetAllData: () => void;
  refreshData: () => void;

  // Global search modal
  isSearchModalOpen: boolean;
  setIsSearchModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [selectedBoxNumber, setSelectedBoxNumber] = useState<string | null>(null);
  const [selectedDossierNumber, setSelectedDossierNumber] = useState<number | null>(null);
  const [selectedJobIdForDetail, setSelectedJobIdForDetail] = useState<number | null>(null);
  const [projectFilterState, setProjectFilterState] = useState<{ box?: string; dossier?: number; status?: ProjectStatus; search?: string }>({});
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Core Data
  const [projects, setProjects] = useState<Project[]>(() => storage.getProjects());
  const [boxes, setBoxes] = useState<Box[]>(() => storage.getBoxes());
  const [users, setUsers] = useState<User[]>(() => storage.getUsers());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => storage.getAuditLogs());
  const [importBatches, setImportBatches] = useState<ImportBatch[]>(() => storage.getImportBatches());
  const [settings, setSettings] = useState<SystemSettings>(() => storage.getSettings());
  const [theme, setTheme] = useState<'light' | 'dark'>(() => storage.getTheme());
  const [currentUserId, setCurrentUserId] = useState<string>(() => storage.getCurrentUserId());

  // Keep theme class in sync on documentElement
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    storage.setTheme(theme);
  }, [theme]);

  // Synchronize boxes status based on projects
  useEffect(() => {
    let updatedBoxes = false;
    const newBoxes = boxes.map((box) => {
      // Don't modify if closed
      if (box.status === 'Closed') return box;
      const evalResult = evaluateBoxClosure(box, projects);
      let newStatus: Box['status'] = 'Open';
      if (evalResult.stats.totalRegistered === 0) {
        newStatus = 'Open';
      } else if (evalResult.canClose) {
        newStatus = 'Completed';
      } else {
        newStatus = 'In Progress';
      }
      if (newStatus !== box.status) {
        updatedBoxes = true;
        return { ...box, status: newStatus };
      }
      return box;
    });

    if (updatedBoxes) {
      setBoxes(newBoxes);
      storage.setBoxes(newBoxes);
    }
  }, [projects]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const switchUser = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user) {
      setCurrentUserId(userId);
      storage.setCurrentUserId(userId);
      // update last login
      const updatedUsers = users.map((u) =>
        u.id === userId ? { ...u, last_login: new Date().toISOString() } : u
      );
      setUsers(updatedUsers);
      storage.setUsers(updatedUsers);
    }
  };

  // RBAC Permission checker
  const hasPermission = (action: 'manage_users' | 'manage_settings' | 'upload_data' | 'override_closure' | 'reopen_box' | 'deliver' | 'generate_labels'): boolean => {
    if (currentUser.role === 'System Manager') return true;
    if (currentUser.role === 'Supervisor') {
      return (
        action === 'deliver' ||
        action === 'generate_labels' ||
        action === 'upload_data'
      );
    }
    if (currentUser.role === 'User') {
      return action === 'generate_labels';
    }
    return false;
  };

  const navigateToBox = (boxNumber: string, dossierNumber?: number) => {
    setSelectedBoxNumber(boxNumber);
    setSelectedDossierNumber(dossierNumber || null);
    setActiveTab('boxes');
  };

  const navigateToProjectsWithFilter = (filter: { box?: string; dossier?: number; status?: ProjectStatus; search?: string }) => {
    setProjectFilterState(filter);
    setActiveTab('projects');
  };

  const updateProjectStatus = (jobId: number, status: ProjectStatus, reason?: string) => {
    const projIndex = projects.findIndex((p) => p.job_id === jobId);
    if (projIndex === -1) return { success: false, error: 'Project not found.' };

    const original = projects[projIndex];
    if (original.status === status) return { success: true };

    const updated: Project = {
      ...original,
      status,
      updated_at: new Date().toISOString(),
    };

    const newProjects = [...projects];
    newProjects[projIndex] = updated;
    setProjects(newProjects);
    storage.setProjects(newProjects);

    // Audit log
    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'PROJECT_STATUS_UPDATE',
      entity_type: 'project',
      entity_id: String(jobId),
      before_state: { status: original.status },
      after_state: { status },
      reason,
      details: `Project #${jobId} (${original.job_name}) status updated from ${original.status} to ${status}.`,
    });
    setAuditLogs(storage.getAuditLogs());

    return { success: true };
  };

  const deliverProject = (jobId: number, recipient?: string, notes?: string) => {
    if (!hasPermission('deliver')) {
      return { success: false, error: 'Access denied: You do not have permission to deliver projects.' };
    }

    const projIndex = projects.findIndex((p) => p.job_id === jobId);
    if (projIndex === -1) return { success: false, error: 'Project not found.' };

    const original = projects[projIndex];
    const updated: Project = {
      ...original,
      status: 'Delivered',
      delivery_info: {
        delivered_at: new Date().toISOString(),
        delivered_by: currentUser.full_name,
        recipient: recipient || 'Physical Archive Handover',
        notes: notes || '',
      },
      updated_at: new Date().toISOString(),
    };

    const newProjects = [...projects];
    newProjects[projIndex] = updated;
    setProjects(newProjects);
    storage.setProjects(newProjects);

    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'PROJECT_DELIVERY',
      entity_type: 'project',
      entity_id: String(jobId),
      before_state: { status: original.status },
      after_state: { status: 'Delivered' },
      details: `Project #${jobId} delivered to ${recipient || 'Archive'}. Recorded by ${currentUser.full_name}.`,
    });
    setAuditLogs(storage.getAuditLogs());

    return { success: true };
  };

  const batchDeliverProjects = (jobIds: number[], recipient?: string, notes?: string) => {
    if (!hasPermission('deliver')) return { success: false, count: 0 };

    const now = new Date().toISOString();
    let count = 0;
    const newProjects = projects.map((p) => {
      if (jobIds.includes(p.job_id) && p.status !== 'Delivered') {
        count++;
        return {
          ...p,
          status: 'Delivered' as ProjectStatus,
          delivery_info: {
            delivered_at: now,
            delivered_by: currentUser.full_name,
            recipient: recipient || 'Batch Archive Handover',
            notes: notes || '',
          },
          updated_at: now,
        };
      }
      return p;
    });

    setProjects(newProjects);
    storage.setProjects(newProjects);

    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'PROJECT_DELIVERY',
      entity_type: 'project',
      entity_id: `batch-${count}`,
      details: `Batch delivered ${count} projects to ${recipient || 'Archive Handover'}.`,
    });
    setAuditLogs(storage.getAuditLogs());

    return { success: true, count };
  };

  const deliverBox = (boxNumber: string, recipient?: string, notes?: string) => {
    if (!hasPermission('deliver')) {
      return { success: false, error: 'Access denied: You do not have permission to deliver boxes.' };
    }

    const boxProjects = projects.filter((p) => p.box_number === boxNumber);
    if (boxProjects.length === 0) {
      return { success: false, error: 'Box contains no projects.' };
    }

    const deliverable = boxProjects.filter((p) => p.status === 'Completed' || p.status === 'Ready for Delivery');
    if (deliverable.length === 0) {
      return { success: false, error: 'No Completed or Ready for Delivery projects in this box.' };
    }

    const jobIds = deliverable.map((p) => p.job_id);
    const { count } = batchDeliverProjects(jobIds, recipient, notes);

    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'BOX_DELIVERY',
      entity_type: 'box',
      entity_id: boxNumber,
      details: `Box ${boxNumber} delivered (${count} projects). Recipient: ${recipient || 'Archive Repository'}.`,
    });
    setAuditLogs(storage.getAuditLogs());

    return { success: true };
  };

  const closeBox = (boxNumber: string, isOverride: boolean, reason?: string) => {
    const boxIndex = boxes.findIndex((b) => b.box_number === boxNumber);
    if (boxIndex === -1) return { success: false, error: 'Box not found.' };

    const targetBox = boxes[boxIndex];
    const evaluation = evaluateBoxClosure(targetBox, projects);

    if (!evaluation.canClose && !isOverride) {
      return {
        success: false,
        error: `Cannot close Box ${boxNumber}: ${evaluation.blockingReasons.join(' ')}`,
      };
    }

    if (isOverride) {
      if (currentUser.role !== 'System Manager') {
        return {
          success: false,
          error: 'Only a System Manager can override box closure restrictions.',
        };
      }
      if (!reason || reason.trim().length < 5) {
        return {
          success: false,
          error: 'A detailed reason is mandatory for manual closure override.',
        };
      }
    }

    const now = new Date().toISOString();
    const updatedBox: Box = {
      ...targetBox,
      status: 'Closed',
      closed_at: now,
      closed_by: currentUser.full_name,
      closure_reason: reason || 'All dossiers and projects verified and completed.',
      is_override_closed: isOverride,
    };

    const newBoxes = [...boxes];
    newBoxes[boxIndex] = updatedBox;
    setBoxes(newBoxes);
    storage.setBoxes(newBoxes);

    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: isOverride ? 'BOX_CLOSE_OVERRIDE' : 'BOX_CLOSE',
      entity_type: 'box',
      entity_id: boxNumber,
      reason: reason || undefined,
      details: isOverride
        ? `Box ${boxNumber} manually closed via System Manager override. Reason: "${reason}". Note: Incomplete projects were NOT automatically marked Completed.`
        : `Box ${boxNumber} closed normally after verifying all dossiers and projects.`,
    });
    setAuditLogs(storage.getAuditLogs());

    return { success: true };
  };

  const reopenBox = (boxNumber: string, reason: string) => {
    if (currentUser.role !== 'System Manager') {
      return { success: false, error: 'Only a System Manager can reopen a closed box.' };
    }
    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'A justification reason is mandatory to reopen a closed box.' };
    }

    const boxIndex = boxes.findIndex((b) => b.box_number === boxNumber);
    if (boxIndex === -1) return { success: false, error: 'Box not found.' };

    const targetBox = boxes[boxIndex];
    const evalResult = evaluateBoxClosure(targetBox, projects);
    const newStatus: Box['status'] = evalResult.canClose ? 'Completed' : 'In Progress';

    const updatedBox: Box = {
      ...targetBox,
      status: newStatus,
      reopened_at: new Date().toISOString(),
      reopened_by: currentUser.full_name,
      reopen_reason: reason,
    };

    const newBoxes = [...boxes];
    newBoxes[boxIndex] = updatedBox;
    setBoxes(newBoxes);
    storage.setBoxes(newBoxes);

    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'BOX_REOPEN',
      entity_type: 'box',
      entity_id: boxNumber,
      reason,
      details: `Box ${boxNumber} reopened. Reason: "${reason}". Status transitioned to ${newStatus}.`,
    });
    setAuditLogs(storage.getAuditLogs());

    return { success: true };
  };

  const commitImportBatch = (
    parseResult: ParseWorkbookResult,
    conflictResolutions: Map<string, 'use_incoming' | 'keep_existing' | 'skip'>
  ) => {
    const existingMap = new Map<number, Project>();
    projects.forEach((p) => existingMap.set(p.job_id, p));

    const now = new Date().toISOString();
    let newCount = 0;
    let existingCount = parseResult.existingProjects.length;
    let changedCount = 0;

    const updatedProjects = [...projects];

    // 1. Commit New Projects
    for (const newRow of parseResult.newProjects) {
      if (!newRow.job_id) continue;
      const alloc = getAllocationForJobId(newRow.job_id, settings.allocation_ranges);

      const newProj: Project = {
        job_id: newRow.job_id,
        job_name: newRow.job_name!,
        branch_name: newRow.branch_name!,
        total_box: newRow.total_box || 1,
        total_document: newRow.total_document || 1,
        total_sheets: newRow.total_sheets || 10,
        date_print: newRow.date_print || now.split('T')[0],
        status: 'Pending',
        box_number: alloc ? alloc.boxNumber : 'Unallocated',
        dossier_number: alloc ? alloc.dossierNumber : 1,
        archive_position: alloc ? alloc.archivePosition : 1,
        created_at: now,
        updated_at: now,
        batch_id: parseResult.filename,
      };

      updatedProjects.push(newProj);
      newCount++;
    }

    // 2. Commit Changed Projects according to user resolution
    for (const changedRow of parseResult.changedProjects) {
      if (!changedRow.job_id) continue;
      const existing = existingMap.get(changedRow.job_id);
      if (!existing) continue;

      // Check conflict resolution
      const resolution = conflictResolutions.get(String(changedRow.job_id)) || 'keep_existing';

      if (resolution === 'use_incoming') {
        const targetIndex = updatedProjects.findIndex((p) => p.job_id === changedRow.job_id);
        if (targetIndex !== -1) {
          updatedProjects[targetIndex] = {
            ...existing,
            job_name: changedRow.job_name || existing.job_name,
            branch_name: changedRow.branch_name || existing.branch_name,
            total_box: changedRow.total_box !== undefined ? changedRow.total_box : existing.total_box,
            total_document: changedRow.total_document !== undefined ? changedRow.total_document : existing.total_document,
            total_sheets: changedRow.total_sheets !== undefined ? changedRow.total_sheets : existing.total_sheets,
            date_print: changedRow.date_print || existing.date_print,
            // Re-import MUST NOT alter allocation or silently overwrite status unless explicitly handled
            updated_at: now,
          };
          changedCount++;
        }
      }
    }

    setProjects(updatedProjects);
    storage.setProjects(updatedProjects);

    // Save batch record
    const batchRecord: ImportBatch = {
      id: `batch-${Date.now()}`,
      filename: parseResult.filename,
      imported_at: now,
      imported_by: currentUser.full_name,
      total_rows: parseResult.totalRows,
      new_count: newCount,
      existing_count: existingCount,
      changed_count: changedCount,
      duplicate_count: parseResult.duplicateProjects.length,
      error_count: parseResult.errorRows.length,
      status: parseResult.errorRows.length > 0 ? 'Has Conflicts' : 'Completed',
    };

    const newBatches = [batchRecord, ...importBatches];
    setImportBatches(newBatches);
    storage.setImportBatches(newBatches);

    // Audit log
    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'IMPORT_BATCH',
      entity_type: 'import_batch',
      entity_id: batchRecord.id,
      details: `Imported '${parseResult.filename}': ${newCount} new projects created, ${changedCount} updated, ${existingCount} unchanged, ${parseResult.duplicateProjects.length} duplicates filtered.`,
    });
    setAuditLogs(storage.getAuditLogs());

    return {
      success: true,
      message: `Import committed successfully. ${newCount} new projects added, ${changedCount} projects updated.`,
    };
  };

  const updateSettings = (newSettings: SystemSettings) => {
    if (currentUser.role !== 'System Manager') return;
    setSettings(newSettings);
    storage.setSettings(newSettings);

    // Re-check boxes to ensure registered boxes match settings
    const currentBoxes = storage.getBoxes();
    const boxMap = new Map<string, Box>();
    currentBoxes.forEach((b) => boxMap.set(b.box_number, b));

    const updatedBoxes: Box[] = newSettings.allocation_ranges.map((range) => {
      const existing = boxMap.get(range.box);
      if (existing) {
        return {
          ...existing,
          first_project: range.first_project,
          last_project: range.last_project,
          capacity: range.capacity,
        };
      }
      return {
        box_number: range.box,
        first_project: range.first_project,
        last_project: range.last_project,
        capacity: range.capacity,
        dossier_count: newSettings.dossiers_per_box,
        projects_per_dossier: newSettings.projects_per_dossier,
        status: 'Open',
        created_at: new Date().toISOString(),
      };
    });

    setBoxes(updatedBoxes);
    storage.setBoxes(updatedBoxes);

    storage.addAuditLog({
      actor: currentUser.full_name,
      actor_role: currentUser.role,
      action: 'SETTINGS_UPDATED',
      entity_type: 'setting',
      entity_id: 'system_settings',
      details: 'System settings & allocation configuration updated.',
    });
    setAuditLogs(storage.getAuditLogs());
  };

  const resetAllData = () => {
    storage.resetAllData();
    setProjects(storage.getProjects());
    setBoxes(storage.getBoxes());
    setUsers(storage.getUsers());
    setAuditLogs(storage.getAuditLogs());
    setImportBatches(storage.getImportBatches());
    setSettings(storage.getSettings());
    setCurrentUserId(storage.getCurrentUserId());
  };

  const refreshData = () => {
    setProjects(storage.getProjects());
    setBoxes(storage.getBoxes());
    setAuditLogs(storage.getAuditLogs());
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        selectedBoxNumber,
        setSelectedBoxNumber,
        selectedDossierNumber,
        setSelectedDossierNumber,
        selectedJobIdForDetail,
        setSelectedJobIdForDetail,
        navigateToBox,
        navigateToProjectsWithFilter,
        projectFilterState,
        setProjectFilterState,
        projects,
        boxes,
        users,
        currentUser,
        auditLogs,
        importBatches,
        settings,
        theme,
        hasPermission,
        switchUser,
        toggleTheme,
        updateProjectStatus,
        deliverProject,
        batchDeliverProjects,
        deliverBox,
        closeBox,
        reopenBox,
        commitImportBatch,
        updateSettings,
        resetAllData,
        refreshData,
        isSearchModalOpen,
        setIsSearchModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
