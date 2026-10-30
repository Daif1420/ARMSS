/**
 * ARMS - Intercom Archive Management System
 * Core TypeScript Definitions & Models
 */

export type ProjectStatus =
  | 'Pending'
  | 'In Progress'
  | 'Completed'
  | 'Missing'
  | 'On Hold'
  | 'Ready for Delivery'
  | 'Delivered';

export type BoxStatus = 'Open' | 'In Progress' | 'Completed' | 'Closed';

export type UserRole = 'System Manager' | 'Supervisor' | 'User';

export interface Project {
  job_id: number;
  job_name: string;
  branch_name: string;
  total_box: number;
  total_document: number;
  total_sheets: number;
  date_print: string; // Mapped from "Date Delivery" in source Excel
  archive_status: ProjectStatus;
  box_number: string;
  dossier_number: number; // 1 to 6
  position: number; // 1 to 300 within box
  dossier_position: number; // 1 to 50 within dossier
  delivery_date?: string;
  delivery_recipient?: string;
  delivery_by?: string;
  delivery_notes?: string;
  is_changed_flag?: boolean;
  change_notes?: string;
  updated_at: string;
  created_at: string;
}

export interface BoxRangeConfig {
  box_number: string;
  start_project: number;
  end_project: number;
  capacity: number;
}

export interface Box {
  box_number: string;
  start_project: number;
  end_project: number;
  capacity: number;
  dossier_count: number;
  status: BoxStatus;
  closed_at?: string;
  closed_by?: string;
  closure_reason?: string;
  is_override_closed?: boolean;
  override_reason?: string;
  reopened_at?: string;
  reopen_reason?: string;
}

export interface Dossier {
  id: string; // e.g. D41-1
  box_number: string;
  dossier_number: number;
  position_range: string; // e.g. "1–50"
  start_project: number;
  end_project: number;
  capacity: number;
}

export interface ImportDiff {
  field: string;
  old_value: any;
  new_value: any;
}

export interface ImportItemReview {
  job_id: number;
  job_name: string;
  branch_name: string;
  total_box: number;
  total_document: number;
  total_sheets: number;
  date_print: string;
  category: 'new' | 'existing' | 'changed' | 'duplicate' | 'error';
  diffs?: ImportDiff[];
  error_message?: string;
  resolved?: boolean;
}

export interface ImportBatch {
  id: string;
  filename: string;
  imported_at: string;
  imported_by: string;
  total_rows: number;
  new_count: number;
  existing_count: number;
  changed_count: number;
  duplicate_count: number;
  error_count: number;
  status: 'Completed' | 'Pending Review' | 'Failed';
}

export type AuditAction =
  | 'IMPORT'
  | 'STATUS_CHANGE'
  | 'DELIVERY'
  | 'BOX_CLOSE'
  | 'BOX_OVERRIDE_CLOSE'
  | 'BOX_REOPEN'
  | 'LABEL_GENERATE'
  | 'USER_CHANGE'
  | 'SETTINGS_UPDATE'
  | 'CONFLICT_RESOLVE';

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: AuditAction;
  entity_type: 'PROJECT' | 'BOX' | 'DOSSIER' | 'IMPORT' | 'USER' | 'SETTINGS';
  entity_id: string;
  old_value?: string;
  new_value?: string;
  reason?: string;
}

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  last_login: string;
  assigned_boxes: string[];
}

export interface SystemSettings {
  box_ranges: BoxRangeConfig[];
  dossiers_per_box: number;
  projects_per_dossier: number;
  box_aggregation_rule: 'sum' | 'distinct';
  delivery_scope: 'both' | 'project' | 'box';
  allow_manual_override: boolean;
  theme: 'light' | 'dark';
}
