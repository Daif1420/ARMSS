import { Box, Project, SystemSettings, UserProfile, AuditLog } from '../types';

export const DEFAULT_SETTINGS: SystemSettings = {
  box_ranges: [
    { box_number: 'D41', start_project: 35150, end_project: 35449, capacity: 300 },
    { box_number: 'D42', start_project: 35500, end_project: 35799, capacity: 300 },
  ],
  dossiers_per_box: 6,
  projects_per_dossier: 50,
  box_aggregation_rule: 'sum',
  delivery_scope: 'both',
  allow_manual_override: true,
  theme: 'light',
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin',
    username: 'admin',
    full_name: 'System Manager',
    role: 'System Manager',
    status: 'Active',
    last_login: '2026-10-30 08:00',
    assigned_boxes: ['D41', 'D42'],
  },
  {
    id: 'user-supervisor',
    username: 'amansoor',
    full_name: 'Ahmed Al-Mansoor (Supervisor)',
    role: 'Supervisor',
    status: 'Active',
    last_login: '2026-10-29 14:22',
    assigned_boxes: ['D41'],
  },
  {
    id: 'user-operator',
    username: 'nfahad',
    full_name: 'Nasser Fahad (Archivist)',
    role: 'User',
    status: 'Active',
    last_login: '2026-10-29 11:15',
    assigned_boxes: ['D41'],
  },
];

export const INITIAL_BOXES: Box[] = [
  {
    box_number: 'D41',
    start_project: 35150,
    end_project: 35449,
    capacity: 300,
    dossier_count: 6,
    status: 'In Progress',
  },
  {
    box_number: 'D42',
    start_project: 35500,
    end_project: 35799,
    capacity: 300,
    dossier_count: 6,
    status: 'Open',
  },
];

// Helper to generate realistic seeded operational projects for D41 and D42
export function generateInitialProjects(): Project[] {
  const branches = [
    'Riyadh Central Branch',
    'Jeddah Main Office',
    'Khobar Business Center',
    'Dammam Operations Hub',
    'Makkah West Branch',
    'Medina Regional Office',
  ];

  const projectPrefixes = [
    'Intercom Tower Infrastructure Report',
    'Fiber Core Expansion Milestone',
    'Data Center Audio Telemetry Audit',
    'Commercial Exchange Network Upgrade',
    'Security Audio Gateway Replacement',
    'Municipal Broadcast Terminal Review',
    'Intercom Substation Inspection Report',
    'Regional VoIP Switch Migration Log',
  ];

  const projects: Project[] = [];

  // Seed projects in D41 (35150 - 35449)
  // Let's seed 70 projects covering Dossiers 1, 2, and 3 with real operational distribution
  for (let id = 35150; id <= 35220; id++) {
    const relPos = id - 35150 + 1; // 1 to 300
    const dossierNum = Math.floor((relPos - 1) / 50) + 1;
    const dossierPos = ((relPos - 1) % 50) + 1;

    let status: Project['archive_status'] = 'Completed';
    let delivery_date: string | undefined = undefined;
    let delivery_recipient: string | undefined = undefined;
    let delivery_by: string | undefined = undefined;

    if (id >= 35150 && id <= 35165) {
      status = 'Delivered';
      delivery_date = '2026-10-25 10:30';
      delivery_recipient = 'Logistics Courier (Abdulaziz Transport)';
      delivery_by = 'System Manager';
    } else if (id >= 35166 && id <= 35185) {
      status = 'Completed';
    } else if (id === 35186 || id === 35187) {
      status = 'Missing'; // Explicitly flagged as missing
    } else if (id >= 35188 && id <= 35195) {
      status = 'Ready for Delivery';
    } else if (id >= 35196 && id <= 35205) {
      status = 'In Progress';
    } else if (id === 35206) {
      status = 'On Hold';
    } else {
      status = 'Pending';
    }

    const branch = branches[id % branches.length];
    const name = `${projectPrefixes[id % projectPrefixes.length]} #${id}`;
    const totalBox = (id % 3) + 1;
    const totalDoc = 8 + (id % 15);
    const totalSheets = totalDoc * (12 + (id % 8));
    const day = 10 + (id % 18);

    projects.push({
      job_id: id,
      job_name: name,
      branch_name: branch,
      total_box: totalBox,
      total_document: totalDoc,
      total_sheets: totalSheets,
      date_print: `2026-10-${day < 10 ? '0' + day : day}`,
      archive_status: status,
      box_number: 'D41',
      dossier_number: dossierNum,
      position: relPos,
      dossier_position: dossierPos,
      delivery_date,
      delivery_recipient,
      delivery_by,
      updated_at: '2026-10-28 14:00',
      created_at: '2026-10-20 09:00',
    });
  }

  // Seed initial sample projects in D42 (35500 - 35520)
  for (let id = 35500; id <= 35515; id++) {
    const relPos = id - 35500 + 1;
    const dossierNum = Math.floor((relPos - 1) / 50) + 1;
    const dossierPos = ((relPos - 1) % 50) + 1;

    const branch = branches[(id + 2) % branches.length];
    const name = `${projectPrefixes[(id + 1) % projectPrefixes.length]} #${id}`;
    const totalBox = (id % 2) + 1;
    const totalDoc = 10 + (id % 10);
    const totalSheets = totalDoc * 14;

    projects.push({
      job_id: id,
      job_name: name,
      branch_name: branch,
      total_box: totalBox,
      total_document: totalDoc,
      total_sheets: totalSheets,
      date_print: '2026-10-28',
      archive_status: id <= 35505 ? 'In Progress' : 'Pending',
      box_number: 'D42',
      dossier_number: dossierNum,
      position: relPos,
      dossier_position: dossierPos,
      updated_at: '2026-10-29 09:30',
      created_at: '2026-10-29 09:30',
    });
  }

  return projects;
}

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    timestamp: '2026-10-20 09:00:15',
    actor: 'System Manager',
    action: 'SETTINGS_UPDATE',
    entity_type: 'SETTINGS',
    entity_id: 'SYSTEM',
    new_value: 'Approved allocation ranges: D41 (35150-35449), D42 (35500-35799)',
    reason: 'Initial system configuration as per requirements specification',
  },
  {
    id: 'audit-002',
    timestamp: '2026-10-22 11:30:00',
    actor: 'System Manager',
    action: 'IMPORT',
    entity_type: 'IMPORT',
    entity_id: 'BATCH-2026-001',
    new_value: 'Imported 71 operational records from workbook بيانات المشاريع.xlsx',
    reason: 'Initial batch allocation to Box D41',
  },
  {
    id: 'audit-003',
    timestamp: '2026-10-25 10:30:22',
    actor: 'System Manager',
    action: 'DELIVERY',
    entity_type: 'PROJECT',
    entity_id: '35150-35165',
    old_value: 'Completed',
    new_value: 'Delivered',
    reason: 'Courier dispatch to Central Archival Vault with Abdulaziz Transport',
  },
  {
    id: 'audit-004',
    timestamp: '2026-10-28 15:45:10',
    actor: 'Ahmed Al-Mansoor (Supervisor)',
    action: 'STATUS_CHANGE',
    entity_type: 'PROJECT',
    entity_id: '35186',
    old_value: 'In Progress',
    new_value: 'Missing',
    reason: 'Physical report missing from folder batch during verification',
  },
];
