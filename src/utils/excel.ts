import * as XLSX from 'xlsx';
import { Project, ImportItemReview, ImportDiff } from '../types';

export interface ParseResult {
  filename: string;
  total_rows: number;
  new_items: ImportItemReview[];
  existing_items: ImportItemReview[];
  changed_items: ImportItemReview[];
  duplicate_items: ImportItemReview[];
  error_items: ImportItemReview[];
  all_items: ImportItemReview[];
}

// Normalized column field mappings
const COLUMN_ALIASES: Record<string, string[]> = {
  job_id: ['job id', 'job_id', 'jobid', 'رقم المشروع', 'معرف المشروع', 'كود المشروع', 'id'],
  job_name: ['job name', 'job_name', 'jobname', 'اسم المشروع', 'المشروع', 'name'],
  branch_name: ['branch name', 'branch_name', 'branch', 'اسم الفرع', 'الفرع', 'الجهة'],
  total_box: ['total box', 'total_box', 'total boxes', 'boxes', 'إجمالي الكراتين', 'عدد الكراتين', 'الكراتين', 'كرتون'],
  total_document: ['total document', 'total_document', 'total documents', 'documents', 'إجمالي المستندات', 'عدد المستندات', 'المستندات', 'ملف'],
  total_sheets: ['total sheets', 'total_sheets', 'sheets', 'إجمالي الصفحات', 'عدد الصفحات', 'الصفحات', 'اوراق', 'أوراق'],
  date_print: ['date delivery', 'datedelivery', 'date_delivery', 'date print', 'date_print', 'تاريخ التسليم', 'تاريخ الطباعة', 'تاريخ التوريد', 'تاريخ'],
};

function matchColumn(header: string): string | null {
  const clean = header.trim().toLowerCase();
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.some(a => clean === a || clean.includes(a))) {
      return field;
    }
  }
  return null;
}

function parseExcelDate(val: any): string {
  if (!val) return '';
  if (typeof val === 'number') {
    // Excel serial date to JS Date
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    return date.toISOString().split('T')[0];
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  const str = String(val).trim();
  // If in format DD/MM/YYYY or YYYY-MM-DD
  const parts = str.split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return str;
}

export async function parseExcelWorkbook(
  file: File,
  existingProjects: Project[]
): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

  // Preferred sheet lookup order: "البيانات (2)", then "بيانات المشاريع", then first sheet
  let targetSheetName = workbook.SheetNames[0];
  if (workbook.SheetNames.includes('البيانات (2)')) {
    targetSheetName = 'البيانات (2)';
  } else if (workbook.SheetNames.includes('بيانات المشاريع')) {
    targetSheetName = 'بيانات المشاريع';
  } else {
    const found = workbook.SheetNames.find(s => s.includes('البيانات') || s.includes('المشاريع'));
    if (found) targetSheetName = found;
  }

  const worksheet = workbook.Sheets[targetSheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: '' });

  // Map header fields
  const sample = rawRows[0] || {};
  const headerMap: Record<string, string> = {};
  for (const key of Object.keys(sample)) {
    const matched = matchColumn(key);
    if (matched) {
      headerMap[matched] = key;
    }
  }

  const existingMap = new Map<number, Project>();
  for (const p of existingProjects) {
    existingMap.set(p.job_id, p);
  }

  const seenInFile = new Set<number>();
  const allItems: ImportItemReview[] = [];
  const newItems: ImportItemReview[] = [];
  const existingItems: ImportItemReview[] = [];
  const changedItems: ImportItemReview[] = [];
  const duplicateItems: ImportItemReview[] = [];
  const errorItems: ImportItemReview[] = [];

  for (let idx = 0; idx < rawRows.length; idx++) {
    const row = rawRows[idx];
    const rawJobId = headerMap.job_id ? row[headerMap.job_id] : row['Job ID'] || row['job_id'];
    const jobIdNum = Number(rawJobId);

    const rawJobName = headerMap.job_name ? row[headerMap.job_name] : row['Job Name'] || row['اسم المشروع'] || '';
    const rawBranch = headerMap.branch_name ? row[headerMap.branch_name] : row['Branch Name'] || row['اسم الفرع'] || 'General';
    const rawTotalBox = Number(headerMap.total_box ? row[headerMap.total_box] : row['Total Box'] || 1) || 1;
    const rawTotalDoc = Number(headerMap.total_document ? row[headerMap.total_document] : row['Total Document'] || 0) || 0;
    const rawTotalSheets = Number(headerMap.total_sheets ? row[headerMap.total_sheets] : row['Total Sheets'] || 0) || 0;
    const rawDate = headerMap.date_print ? row[headerMap.date_print] : row['Date Delivery'] || row['Date Print'] || '';
    const dateFormatted = parseExcelDate(rawDate) || new Date().toISOString().split('T')[0];

    // Validation checks
    if (!rawJobId || isNaN(jobIdNum) || jobIdNum <= 0) {
      const errItem: ImportItemReview = {
        job_id: jobIdNum || 0,
        job_name: String(rawJobName || `Row #${idx + 2}`),
        branch_name: String(rawBranch),
        total_box: rawTotalBox,
        total_document: rawTotalDoc,
        total_sheets: rawTotalSheets,
        date_print: dateFormatted,
        category: 'error',
        error_message: `Row #${idx + 2}: Invalid or missing Job ID (${rawJobId})`,
      };
      errorItems.push(errItem);
      allItems.push(errItem);
      continue;
    }

    if (!rawJobName || String(rawJobName).trim() === '') {
      const errItem: ImportItemReview = {
        job_id: jobIdNum,
        job_name: `Project #${jobIdNum}`,
        branch_name: String(rawBranch),
        total_box: rawTotalBox,
        total_document: rawTotalDoc,
        total_sheets: rawTotalSheets,
        date_print: dateFormatted,
        category: 'error',
        error_message: `Row #${idx + 2}: Missing Job Name for ID ${jobIdNum}`,
      };
      errorItems.push(errItem);
      allItems.push(errItem);
      continue;
    }

    // Check duplicate inside file
    if (seenInFile.has(jobIdNum)) {
      const dupItem: ImportItemReview = {
        job_id: jobIdNum,
        job_name: String(rawJobName),
        branch_name: String(rawBranch),
        total_box: rawTotalBox,
        total_document: rawTotalDoc,
        total_sheets: rawTotalSheets,
        date_print: dateFormatted,
        category: 'duplicate',
        error_message: `Duplicate Job ID ${jobIdNum} repeated within this uploaded file`,
      };
      duplicateItems.push(dupItem);
      allItems.push(dupItem);
      continue;
    }
    seenInFile.add(jobIdNum);

    // Check if exists in stored projects
    const existing = existingMap.get(jobIdNum);
    if (!existing) {
      const newItem: ImportItemReview = {
        job_id: jobIdNum,
        job_name: String(rawJobName).trim(),
        branch_name: String(rawBranch).trim(),
        total_box: rawTotalBox,
        total_document: rawTotalDoc,
        total_sheets: rawTotalSheets,
        date_print: dateFormatted,
        category: 'new',
      };
      newItems.push(newItem);
      allItems.push(newItem);
    } else {
      // Check for diffs
      const diffs: ImportDiff[] = [];
      if (existing.job_name !== String(rawJobName).trim()) {
        diffs.push({ field: 'Job Name', old_value: existing.job_name, new_value: String(rawJobName).trim() });
      }
      if (existing.branch_name !== String(rawBranch).trim()) {
        diffs.push({ field: 'Branch Name', old_value: existing.branch_name, new_value: String(rawBranch).trim() });
      }
      if (existing.total_box !== rawTotalBox) {
        diffs.push({ field: 'Total Box', old_value: existing.total_box, new_value: rawTotalBox });
      }
      if (existing.total_document !== rawTotalDoc) {
        diffs.push({ field: 'Total Document', old_value: existing.total_document, new_value: rawTotalDoc });
      }
      if (existing.total_sheets !== rawTotalSheets) {
        diffs.push({ field: 'Total Sheets', old_value: existing.total_sheets, new_value: rawTotalSheets });
      }

      if (diffs.length > 0) {
        const chgItem: ImportItemReview = {
          job_id: jobIdNum,
          job_name: String(rawJobName).trim(),
          branch_name: String(rawBranch).trim(),
          total_box: rawTotalBox,
          total_document: rawTotalDoc,
          total_sheets: rawTotalSheets,
          date_print: dateFormatted,
          category: 'changed',
          diffs,
          error_message: `Values differ from stored project records (${diffs.map(d => d.field).join(', ')})`,
        };
        changedItems.push(chgItem);
        allItems.push(chgItem);
      } else {
        const existItem: ImportItemReview = {
          job_id: jobIdNum,
          job_name: existing.job_name,
          branch_name: existing.branch_name,
          total_box: existing.total_box,
          total_document: existing.total_document,
          total_sheets: existing.total_sheets,
          date_print: existing.date_print,
          category: 'existing',
        };
        existingItems.push(existItem);
        allItems.push(existItem);
      }
    }
  }

  return {
    filename: file.name,
    total_rows: rawRows.length,
    new_items: newItems,
    existing_items: existingItems,
    changed_items: changedItems,
    duplicate_items: duplicateItems,
    error_items: errorItems,
    all_items: allItems,
  };
}

// Generates a downloadable sample Excel workbook conforming to specification
export function generateSampleWorkbook(): void {
  const data = [
    {
      'Job ID': 35221,
      'Job Name': 'Intercom Tower Substation Telemetry #35221',
      'Branch Name': 'Riyadh Central Branch',
      'Total Box': 1,
      'Total Document': 12,
      'Total Sheets': 180,
      'Date Delivery': '2026-10-29',
    },
    {
      'Job ID': 35222,
      'Job Name': 'Audio Gateway Expansion Stage 2 #35222',
      'Branch Name': 'Jeddah Main Office',
      'Total Box': 2,
      'Total Document': 15,
      'Total Sheets': 240,
      'Date Delivery': '2026-10-29',
    },
    {
      'Job ID': 35223,
      'Job Name': 'Fiber Optic Voice Link Verification #35223',
      'Branch Name': 'Khobar Business Center',
      'Total Box': 1,
      'Total Document': 9,
      'Total Sheets': 110,
      'Date Delivery': '2026-10-30',
    },
    {
      'Job ID': 35166, // Existing record with a change in sheets to test conflict review
      'Job Name': 'Intercom Tower Infrastructure Report #35166',
      'Branch Name': 'Jeddah Main Office',
      'Total Box': 1,
      'Total Document': 22,
      'Total Sheets': 390, // Changed from 308 to trigger review
      'Date Delivery': '2026-10-30',
    },
    {
      'Job ID': 35516, // In Box D42 range
      'Job Name': 'Municipal Regional Exchange Review #35516',
      'Branch Name': 'Dammam Operations Hub',
      'Total Box': 1,
      'Total Document': 14,
      'Total Sheets': 195,
      'Date Delivery': '2026-10-30',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'بيانات المشاريع');

  XLSX.writeFile(wb, 'بيانات_المشاريع_نموذج_تشغيلي.xlsx');
}

// Export arbitrary data to Excel
export function exportToExcel(data: any[], filename: string, sheetName = 'Export'): void {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
