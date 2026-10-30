import * as XLSX from 'xlsx';
import { AllocationRangeConfig, ImportConflict, Project } from '../types';
import { getAllocationForJobId } from './allocation';

export interface ParsedRowResult {
  rowIndex: number;
  raw: Record<string, any>;
  job_id?: number;
  job_name?: string;
  branch_name?: string;
  total_box?: number;
  total_document?: number;
  total_sheets?: number;
  date_print?: string;
  category: 'new' | 'existing' | 'changed' | 'duplicate' | 'error';
  errorMessage?: string;
  differences?: { field: string; existing: any; incoming: any }[];
  allocatedBox?: string;
  allocatedDossier?: number;
  allocatedPosition?: number;
}

export interface ParseWorkbookResult {
  filename: string;
  totalRows: number;
  validRows: ParsedRowResult[];
  newProjects: ParsedRowResult[];
  existingProjects: ParsedRowResult[];
  changedProjects: ParsedRowResult[];
  duplicateProjects: ParsedRowResult[];
  errorRows: ParsedRowResult[];
  conflicts: ImportConflict[];
}

/**
 * Standard column names matching specification
 */
export const REQUIRED_COLUMNS = [
  'Job ID',
  'Job Name',
  'Branch Name',
  'Total Box',
  'Total Document',
  'Total Sheets',
  'Date Delivery', // Maps to date_print
];

/**
 * Normalizes header keys to handle slight trimming or casing variations
 */
function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s_-]+/g, '');
}

/**
 * Parses an ArrayBuffer or binary string into project records
 */
export function parseExcelWorkbook(
  data: ArrayBuffer | Uint8Array,
  filename: string,
  existingProjects: Project[],
  ranges: AllocationRangeConfig[],
  batchId: string
): ParseWorkbookResult {
  const workbook = XLSX.read(data, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert to JSON array of objects
  const rawRows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
    defval: '',
  });

  const existingMap = new Map<number, Project>();
  for (const p of existingProjects) {
    existingMap.set(p.job_id, p);
  }

  const seenInFileJobIds = new Set<number>();
  const parsedRows: ParsedRowResult[] = [];
  const conflicts: ImportConflict[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // 1-indexed Excel row accounting for header

    // Map column names flexibly
    let jobIdRaw: any = undefined;
    let jobNameRaw: any = undefined;
    let branchNameRaw: any = undefined;
    let totalBoxRaw: any = undefined;
    let totalDocRaw: any = undefined;
    let totalSheetsRaw: any = undefined;
    let dateDeliveryRaw: any = undefined;

    for (const [key, val] of Object.entries(row)) {
      const norm = normalizeKey(key);
      if (norm === 'jobid' || norm === 'job_id' || norm === 'رقمالمشروع' || norm === 'jobno') {
        jobIdRaw = val;
      } else if (norm === 'jobname' || norm === 'job_name' || norm === 'اسمالمشروع') {
        jobNameRaw = val;
      } else if (norm === 'branchname' || norm === 'branch' || norm === 'الفرع') {
        branchNameRaw = val;
      } else if (norm === 'totalbox' || norm === 'total_box' || norm === 'إجماليالكراتين') {
        totalBoxRaw = val;
      } else if (norm === 'totaldocument' || norm === 'totaldoc' || norm === 'إجماليالمستندات') {
        totalDocRaw = val;
      } else if (norm === 'totalsheets' || norm === 'totalsheet' || norm === 'إجماليالأوراق') {
        totalSheetsRaw = val;
      } else if (
        norm === 'datedelivery' ||
        norm === 'dateprint' ||
        norm === 'deliverydate' ||
        norm === 'تاريخالتسليم' ||
        norm === 'تاريخالطباعة'
      ) {
        dateDeliveryRaw = val;
      }
    }

    // Validation
    const jobId = parseInt(String(jobIdRaw).replace(/[^0-9]/g, ''), 10);
    const jobName = String(jobNameRaw || '').trim();
    const branchName = String(branchNameRaw || 'Intercom Central').trim();
    const totalBox = Math.max(0, parseInt(String(totalBoxRaw || 1), 10) || 1);
    const totalDocument = Math.max(0, parseInt(String(totalDocRaw || 1), 10) || 1);
    const totalSheets = Math.max(0, parseInt(String(totalSheetsRaw || 10), 10) || 10);

    // Format date string
    let datePrint = '';
    if (typeof dateDeliveryRaw === 'number') {
      // Excel serial date
      const dateObj = XLSX.SSF.parse_date_code(dateDeliveryRaw);
      if (dateObj) {
        datePrint = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
      }
    } else if (dateDeliveryRaw) {
      datePrint = String(dateDeliveryRaw).trim();
    }
    if (!datePrint) {
      datePrint = new Date().toISOString().split('T')[0];
    }

    if (isNaN(jobId) || jobId <= 0) {
      parsedRows.push({
        rowIndex: rowNum,
        raw: row,
        category: 'error',
        errorMessage: 'Invalid or missing Job ID. Must be a positive integer.',
      });
      return;
    }

    if (!jobName) {
      parsedRows.push({
        rowIndex: rowNum,
        raw: row,
        job_id: jobId,
        category: 'error',
        errorMessage: 'Job Name cannot be empty.',
      });
      return;
    }

    // Check for duplicate in the uploaded workbook
    if (seenInFileJobIds.has(jobId)) {
      parsedRows.push({
        rowIndex: rowNum,
        raw: row,
        job_id: jobId,
        job_name: jobName,
        branch_name: branchName,
        total_box: totalBox,
        total_document: totalDocument,
        total_sheets: totalSheets,
        date_print: datePrint,
        category: 'duplicate',
        errorMessage: `Duplicate Job ID ${jobId} repeated within the uploaded workbook.`,
      });
      return;
    }
    seenInFileJobIds.add(jobId);

    // Check archive allocation
    const allocation = getAllocationForJobId(jobId, ranges);

    // Check against existing system projects
    const existing = existingMap.get(jobId);

    if (!existing) {
      // New project!
      parsedRows.push({
        rowIndex: rowNum,
        raw: row,
        job_id: jobId,
        job_name: jobName,
        branch_name: branchName,
        total_box: totalBox,
        total_document: totalDocument,
        total_sheets: totalSheets,
        date_print: datePrint,
        category: 'new',
        allocatedBox: allocation ? allocation.boxNumber : 'Unallocated',
        allocatedDossier: allocation ? allocation.dossierNumber : undefined,
        allocatedPosition: allocation ? allocation.archivePosition : undefined,
      });
    } else {
      // Check if values have changed
      const differences: { field: string; existing: any; incoming: any }[] = [];
      if (existing.job_name !== jobName) {
        differences.push({ field: 'Job Name', existing: existing.job_name, incoming: jobName });
      }
      if (existing.branch_name !== branchName) {
        differences.push({ field: 'Branch Name', existing: existing.branch_name, incoming: branchName });
      }
      if (existing.total_box !== totalBox) {
        differences.push({ field: 'Total Box', existing: existing.total_box, incoming: totalBox });
      }
      if (existing.total_document !== totalDocument) {
        differences.push({ field: 'Total Document', existing: existing.total_document, incoming: totalDocument });
      }
      if (existing.total_sheets !== totalSheets) {
        differences.push({ field: 'Total Sheets', existing: existing.total_sheets, incoming: totalSheets });
      }
      if (existing.date_print !== datePrint && datePrint) {
        differences.push({ field: 'Date Print', existing: existing.date_print, incoming: datePrint });
      }

      if (differences.length > 0) {
        // Changed project requiring review
        parsedRows.push({
          rowIndex: rowNum,
          raw: row,
          job_id: jobId,
          job_name: jobName,
          branch_name: branchName,
          total_box: totalBox,
          total_document: totalDocument,
          total_sheets: totalSheets,
          date_print: datePrint,
          category: 'changed',
          differences,
          allocatedBox: existing.box_number,
          allocatedDossier: existing.dossier_number,
          allocatedPosition: existing.archive_position,
        });

        // Record conflict
        differences.forEach((diff, dIdx) => {
          conflicts.push({
            id: `conflict-${batchId}-${jobId}-${dIdx}`,
            batch_id: batchId,
            row_index: rowNum,
            job_id: jobId,
            field_name: diff.field,
            existing_value: diff.existing,
            incoming_value: diff.incoming,
            type: 'changed_data',
            resolved: false,
          });
        });
      } else {
        // Exact existing match
        parsedRows.push({
          rowIndex: rowNum,
          raw: row,
          job_id: jobId,
          job_name: jobName,
          branch_name: branchName,
          total_box: totalBox,
          total_document: totalDocument,
          total_sheets: totalSheets,
          date_print: datePrint,
          category: 'existing',
          allocatedBox: existing.box_number,
          allocatedDossier: existing.dossier_number,
          allocatedPosition: existing.archive_position,
        });
      }
    }
  });

  return {
    filename,
    totalRows: rawRows.length,
    validRows: parsedRows.filter((r) => r.category !== 'error'),
    newProjects: parsedRows.filter((r) => r.category === 'new'),
    existingProjects: parsedRows.filter((r) => r.category === 'existing'),
    changedProjects: parsedRows.filter((r) => r.category === 'changed'),
    duplicateProjects: parsedRows.filter((r) => r.category === 'duplicate'),
    errorRows: parsedRows.filter((r) => r.category === 'error'),
    conflicts,
  };
}

/**
 * Creates and downloads a sample Excel workbook `بيانات المشاريع.xlsx`
 * with realistic Intercom project data matching D41 (35150–35449) and D42 (35500–35799).
 */
export function generateSampleExcelWorkbook(): Uint8Array {
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

  const sampleData: any[] = [];

  // Generate 60 realistic sample rows:
  // 30 projects in D41 range (35150..35179)
  for (let id = 35150; id <= 35179; id++) {
    const branch = branches[id % branches.length];
    const title = projectTitles[id % projectTitles.length];
    const totalBox = (id % 3) + 1;
    const totalDoc = (id % 7) + 2;
    const totalSheets = totalDoc * 28 + (id % 15);
    const day = 10 + (id % 18);
    sampleData.push({
      'Job ID': id,
      'Job Name': `${title} - كود #${id}`,
      'Branch Name': branch,
      'Total Box': totalBox,
      'Total Document': totalDoc,
      'Total Sheets': totalSheets,
      'Date Delivery': `2026-10-${String(day).padStart(2, '0')}`,
    });
  }

  // 25 projects in D42 range (35500..35524)
  for (let id = 35500; id <= 35524; id++) {
    const branch = branches[(id + 2) % branches.length];
    const title = projectTitles[(id + 3) % projectTitles.length];
    const totalBox = (id % 2) + 1;
    const totalDoc = (id % 5) + 3;
    const totalSheets = totalDoc * 32 + (id % 12);
    const day = 5 + (id % 22);
    sampleData.push({
      'Job ID': id,
      'Job Name': `${title} - كود #${id}`,
      'Branch Name': branch,
      'Total Box': totalBox,
      'Total Document': totalDoc,
      'Total Sheets': totalSheets,
      'Date Delivery': `2026-10-${String(day).padStart(2, '0')}`,
    });
  }

  // 1 deliberate duplicate row to test duplicate detection
  sampleData.push({
    'Job ID': 35152,
    'Job Name': 'مشروع مكرر للتجربة - Duplicate Test',
    'Branch Name': 'Cairo HQ — Operations',
    'Total Box': 1,
    'Total Document': 2,
    'Total Sheets': 45,
    'Date Delivery': '2026-10-15',
  });

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'بيانات المشاريع');

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
}

/**
 * Exports arbitrary tabular data to an XLSX file and triggers client-side download
 */
export function exportToXlsx(data: Record<string, any>[], filename: string, sheetName = 'Sheet1') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}
