/**
 * ARMS - Intercom Archive Management System
 * Core Domain Types
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
  date_print: string; // Mapped from source 'Date Delivery'
  status: ProjectStatus;
  box_number: string;
  dossier_number: number; // 1 to 6
  archive_position: number; // 1 to 300
  delivery_info?: {
    delivered_at: string;
    delivered_by: string;
    recipient?: string;
    notes?: string;
  };
  notes?: string;
  created_at: string;
  updated_at: string;
  batch_id?: string;
}

export interface Box {
  box_number: string;
  first_project: number;
  last_project: number;
  capacity: number;
  dossier_count: number;
  projects_per_dossier: number;
  status: BoxStatus;
  closed_at?: string;
  closed_by?: string;
  closure_reason?: string;
  is_override_closed?: boolean;
  reopened_at?: string;
  reopened_by?: string;
  reopen_reason?: string;
  created_at: string;
}

export interface Dossier {
  dossier_number: number; // 1 to 6
  box_number: string;
  first_project: number;
  last_project: number;
  capacity: number; // 50
  position_range: string; // e.g. "1–50"
  status: 'Pending' | 'In Progress' | 'Completed';
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
  status: 'Completed' | 'Has Conflicts' | 'Failed';
  notes?: string;
}

export interface ImportConflict {
  id: string;
  batch_id: string;
  row_index: number;
  job_id: number;
  field_name: string;
  existing_value: any;
  incoming_value: any;
  type: 'changed_data' | 'changed_status' | 'duplicate_in_file' | 'unallocated_range';
  resolved: boolean;
  resolution?: 'keep_existing' | 'use_incoming' | 'skip';
}

export interface AuditLog {
  id: string;
  actor: string;
  actor_role: UserRole;
  action:
    | 'IMPORT_BATCH'
    | 'PROJECT_STATUS_UPDATE'
    | 'PROJECT_DELIVERY'
    | 'BOX_DELIVERY'
    | 'BOX_CLOSE'
    | 'BOX_CLOSE_OVERRIDE'
    | 'BOX_REOPEN'
    | 'LABEL_GENERATED'
    | 'MANUAL_LABEL_CREATED'
    | 'USER_ROLE_CHANGED'
    | 'SETTINGS_UPDATED'
    | 'DATA_RESET';
  entity_type: 'project' | 'box' | 'dossier' | 'import_batch' | 'user' | 'setting' | 'label';
  entity_id: string;
  timestamp: string;
  before_state?: any;
  after_state?: any;
  reason?: string;
  details?: string;
}

export interface User {
  id: string;
  user_name: string;
  full_name: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  last_login: string;
  assigned_boxes: string[];
  assigned_dossiers: string[];
}

export interface AllocationRangeConfig {
  box: string;
  first_project: number;
  last_project: number;
  capacity: number;
}

export interface SystemSettings {
  allocation_ranges: AllocationRangeConfig[];
  standard_box_capacity: number; // 300
  dossiers_per_box: number; // 6
  projects_per_dossier: number; // 50
  total_box_aggregation: 'sum' | 'count_distinct';
  delivery_scope: 'both' | 'project_only' | 'box_only';
  label_printer: 'zebra_zpl' | 'standard_thermal';
  label_width_mm: number; // 100
  label_height_mm: number; // 50
  company_name: string;
  archive_title: string;
}
