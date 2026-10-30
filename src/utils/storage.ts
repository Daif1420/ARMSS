import {
  AuditLog,
  Box,
  ImportBatch,
  ImportConflict,
  Project,
  SystemSettings,
  User,
} from '../types';
import { DEFAULT_ALLOCATION_RANGES, getAllocationForJobId } from './allocation';

const STORAGE_KEYS = {
  PROJECTS: 'arms_projects_v1',
  BOXES: 'arms_boxes_v1',
  USERS: 'arms_users_v1',
  CURRENT_USER_ID: 'arms_current_user_id_v1',
  AUDIT_LOGS: 'arms_audit_logs_v1',
  IMPORT_BATCHES: 'arms_import_batches_v1',
  SETTINGS: 'arms_settings_v1',
  THEME: 'arms_theme_v1',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'user-1',
    user_name: 'tarek.manager',
    full_name: 'Eng. Tarek Mansour',
    role: 'System Manager',
    status: 'Active',
    last_login: '2026-10-30T09:15:00Z',
    assigned_boxes: ['D41', 'D42'],
    assigned_dossiers: [],
  },
  {
    id: 'user-2',
    user_name: 'sarah.ops',
    full_name: 'Sarah Al-Ghamdi',
    role: 'Supervisor',
    status: 'Active',
    last_login: '2026-10-30T08:45:00Z',
    assigned_boxes: ['D41'],
    assigned_dossiers: ['D41-D1', 'D41-D2'],
  },
  {
    id: 'user-3',
    user_name: 'ahmed.archivist',
    full_name: 'Ahmed Ezzat',
    role: 'User',
    status: 'Active',
    last_login: '2026-10-29T16:20:00Z',
    assigned_boxes: ['D41'],
    assigned_dossiers: ['D41-D1'],
  },
];

export const INITIAL_SETTINGS: SystemSettings = {
  allocation_ranges: DEFAULT_ALLOCATION_RANGES,
  standard_box_capacity: 300,
  dossiers_per_box: 6,
  projects_per_dossier: 50,
  total_box_aggregation: 'sum',
  delivery_scope: 'both',
  label_printer: 'zebra_zpl',
  label_width_mm: 100,
  label_height_mm: 50,
  company_name: 'Intercom Operations',
  archive_title: 'Intercom Project Reports Physical Archive',
};

export const INITIAL_BOXES: Box[] = [
  {
    box_number: 'D41',
    first_project: 35150,
    last_project: 35449,
    capacity: 300,
    dossier_count: 6,
    projects_per_dossier: 50,
    status: 'In Progress',
    created_at: '2026-10-15T08:00:00Z',
  },
  {
    box_number: 'D42',
    first_project: 35500,
    last_project: 35799,
    capacity: 300,
    dossier_count: 6,
    projects_per_dossier: 50,
    status: 'Open',
    created_at: '2026-10-20T10:30:00Z',
  },
];

export function generateSeedProjects(): Project[] {
  const branches = [
    'Cairo HQ — Operations',
    'Alexandria Coastal Hub',
    'Giza Telecommunications',
    'Mansoura Regional Office',
    'Red Sea Technology Center',
    'Assiut Logistics Hub',
  ];

  const projectTitles = [
    'تقرير التوريد والتركيب السنوي لأنظمة الاتصال الميداني',
    'مشروع تحديث سنترالات الألياف الضوئية لمجمعات الأعمال',
    'عقد الصيانة الوقائية لأجهزة المراقبة والتحكم المركزي',
    'تقرير تدقيق البنية التحتية والشبكات اللاسلكية',
    'مشروع توريد محطات الإرسال الرئيسية للمواقع الصناعية',
    'تقرير الفحص الدوري لمنظومات الاتصال الصوتي والمرئي',
    'تطوير شبكات الربط البيني للأبراج ومحطات التكرار',
    'مشروع تركيب منظومة الأمن السيبراني لمحطات البيانات',
    'عقد استبدال المحولات ووحدات الطاقة غير المنقطعة UPS',
    'تقرير تسليم مرحلة الفحص الموقعي والتشغيل التجريبي',
  ];

  const projects: Project[] = [];

  // Seed Box D41 (35150..35220) - 71 real projects
  for (let id = 35150; id <= 35220; id++) {
    const alloc = getAllocationForJobId(id, DEFAULT_ALLOCATION_RANGES)!;
    const branch = branches[id % branches.length];
    const title = projectTitles[id % projectTitles.length];
    const totalBox = (id % 3) + 1;
    const totalDoc = (id % 6) + 2;
    const totalSheets = totalDoc * 30 + (id % 20);
    const day = (id % 25) + 1;
    const datePrint = `2026-10-${String(day).padStart(2, '0')}`;

    let status: Project['status'] = 'Completed';
    let deliveryInfo = undefined;

    // Specific realistic distribution for Box D41:
    if (id === 35154 || id === 35188) {
      status = 'Missing'; // Expected in archive but unlocated
    } else if (id === 35165 || id === 35199) {
      status = 'On Hold';
    } else if (id >= 35215) {
      status = 'Pending';
    } else if (id >= 35205) {
      status = 'In Progress';
    } else if (id >= 35200) {
      status = 'Ready for Delivery';
    } else if (id <= 35160) {
      status = 'Delivered';
      deliveryInfo = {
        delivered_at: `2026-10-27T14:30:00Z`,
        delivered_by: 'Eng. Tarek Mansour',
        recipient: 'Intercom Archive Repository - Shelf A4',
        notes: 'Handover protocol signed and verified.',
      };
    } else {
      status = 'Completed';
    }

    projects.push({
      job_id: id,
      job_name: `${title} - كود #${id}`,
      branch_name: branch,
      total_box: totalBox,
      total_document: totalDoc,
      total_sheets: totalSheets,
      date_print: datePrint,
      status,
      box_number: alloc.boxNumber,
      dossier_number: alloc.dossierNumber,
      archive_position: alloc.archivePosition,
      delivery_info: deliveryInfo,
      created_at: '2026-10-20T08:00:00Z',
      updated_at: '2026-10-28T11:00:00Z',
      batch_id: 'batch-init-001',
    });
  }

  // Seed Box D42 (35500..35545) - 46 real projects
  for (let id = 35500; id <= 35545; id++) {
    const alloc = getAllocationForJobId(id, DEFAULT_ALLOCATION_RANGES)!;
    const branch = branches[(id + 1) % branches.length];
    const title = projectTitles[(id + 2) % projectTitles.length];
    const totalBox = (id % 2) + 1;
    const totalDoc = (id % 5) + 3;
    const totalSheets = totalDoc * 25 + (id % 15);
    const day = (id % 20) + 5;
    const datePrint = `2026-10-${String(day).padStart(2, '0')}`;

    let status: Project['status'] = 'Pending';
    if (id < 35515) {
      status = 'In Progress';
    } else if (id < 35525) {
      status = 'Ready for Delivery';
    }

    projects.push({
      job_id: id,
      job_name: `${title} - كود #${id}`,
      branch_name: branch,
      total_box: totalBox,
      total_document: totalDoc,
      total_sheets: totalSheets,
      date_print: datePrint,
      status,
      box_number: alloc.boxNumber,
      dossier_number: alloc.dossierNumber,
      archive_position: alloc.archivePosition,
      created_at: '2026-10-25T09:30:00Z',
      updated_at: '2026-10-29T14:15:00Z',
      batch_id: 'batch-init-002',
    });
  }

  return projects;
}

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-001',
    actor: 'Eng. Tarek Mansour',
    actor_role: 'System Manager',
    action: 'SETTINGS_UPDATED',
    entity_type: 'setting',
    entity_id: 'allocation_ranges',
    timestamp: '2026-10-15T08:00:00Z',
    details: 'Configured confirmed allocation ranges: D41 (35150–35449), D42 (35500–35799).',
  },
  {
    id: 'log-002',
    actor: 'Eng. Tarek Mansour',
    actor_role: 'System Manager',
    action: 'IMPORT_BATCH',
    entity_type: 'import_batch',
    entity_id: 'batch-init-001',
    timestamp: '2026-10-20T08:30:00Z',
    details: 'Imported operational workbook بيانات المشاريع_أكتوبر_2026.xlsx (71 records committed to Box D41).',
  },
  {
    id: 'log-003',
    actor: 'Sarah Al-Ghamdi',
    actor_role: 'Supervisor',
    action: 'PROJECT_STATUS_UPDATE',
    entity_type: 'project',
    entity_id: '35154',
    timestamp: '2026-10-22T10:15:00Z',
    before_state: { status: 'Pending' },
    after_state: { status: 'Missing' },
    reason: 'Project folder not found during physical dossier verification.',
  },
  {
    id: 'log-004',
    actor: 'Eng. Tarek Mansour',
    actor_role: 'System Manager',
    action: 'PROJECT_DELIVERY',
    entity_type: 'project',
    entity_id: '35150',
    timestamp: '2026-10-27T14:30:00Z',
    details: 'Delivered project #35150 to Intercom Archive Repository - Shelf A4.',
  },
  {
    id: 'log-005',
    actor: 'Sarah Al-Ghamdi',
    actor_role: 'Supervisor',
    action: 'LABEL_GENERATED',
    entity_type: 'label',
    entity_id: 'D41-LABEL',
    timestamp: '2026-10-28T09:00:00Z',
    details: 'Generated 100x50mm Code 128 Box Label for D41 (35150–35449).',
  },
];

export const INITIAL_IMPORT_BATCHES: ImportBatch[] = [
  {
    id: 'batch-init-001',
    filename: 'بيانات المشاريع_أكتوبر_2026.xlsx',
    imported_at: '2026-10-20T08:30:00Z',
    imported_by: 'Eng. Tarek Mansour',
    total_rows: 71,
    new_count: 71,
    existing_count: 0,
    changed_count: 0,
    duplicate_count: 0,
    error_count: 0,
    status: 'Completed',
  },
  {
    id: 'batch-init-002',
    filename: 'بيانات المشاريع_دفعة_D42.xlsx',
    imported_at: '2026-10-25T09:30:00Z',
    imported_by: 'Eng. Tarek Mansour',
    total_rows: 46,
    new_count: 46,
    existing_count: 0,
    changed_count: 0,
    duplicate_count: 0,
    error_count: 0,
    status: 'Completed',
  },
];

export const storage = {
  getProjects(): Project[] {
    const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
    if (!raw) {
      const initial = generateSeedProjects();
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  },

  setProjects(projects: Project[]) {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  },

  getBoxes(): Box[] {
    const raw = localStorage.getItem(STORAGE_KEYS.BOXES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(INITIAL_BOXES));
      return INITIAL_BOXES;
    }
    return JSON.parse(raw);
  },

  setBoxes(boxes: Box[]) {
    localStorage.setItem(STORAGE_KEYS.BOXES, JSON.stringify(boxes));
  },

  getUsers(): User[] {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(raw);
  },

  setUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUserId(): string {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, INITIAL_USERS[0].id);
      return INITIAL_USERS[0].id;
    }
    return raw;
  },

  setCurrentUserId(id: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
  },

  getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    return JSON.parse(raw);
  },

  setAuditLogs(logs: AuditLog[]) {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const current = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    this.setAuditLogs([newLog, ...current]);
    return newLog;
  },

  getImportBatches(): ImportBatch[] {
    const raw = localStorage.getItem(STORAGE_KEYS.IMPORT_BATCHES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.IMPORT_BATCHES, JSON.stringify(INITIAL_IMPORT_BATCHES));
      return INITIAL_IMPORT_BATCHES;
    }
    return JSON.parse(raw);
  },

  setImportBatches(batches: ImportBatch[]) {
    localStorage.setItem(STORAGE_KEYS.IMPORT_BATCHES, JSON.stringify(batches));
  },

  getSettings(): SystemSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(INITIAL_SETTINGS));
      return INITIAL_SETTINGS;
    }
    return JSON.parse(raw);
  },

  setSettings(settings: SystemSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getTheme(): 'light' | 'dark' {
    const raw = localStorage.getItem(STORAGE_KEYS.THEME);
    return raw === 'dark' ? 'dark' : 'light';
  },

  setTheme(theme: 'light' | 'dark') {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  resetAllData() {
    localStorage.removeItem(STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(STORAGE_KEYS.BOXES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.IMPORT_BATCHES);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  },
};
