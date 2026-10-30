import * as XLSX from "xlsx";

// Robust workbook parsing for the ARMS import.
// Problem this solves: headers in the real workbook rarely match the English names exactly
// (extra spaces, different case, Arabic titles, title rows above the header). When a totals column
// was not recognised the importer silently stored NULL, so the system showed no real numbers.

export const FIELDS = ["job_id", "job_name", "branch_name", "total_boxes", "total_documents", "total_sheets", "date_of_delivery"] as const;
export type Field = (typeof FIELDS)[number];

// Canonical form: NFKC, no diacritics/tatweel, unified Arabic letters, lower case, only letters+digits.
export function canon(s: any): string {
  return String(s ?? "")
    .normalize("NFKC")
    .replace(/[ً-ٰٟـ​-‏‪-‮﻿]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي")
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "");
}

const ALIASES: Record<Field, string[]> = {
  job_id: ["Job ID", "JobID", "Job No", "Job Number", "Project ID", "ID", "رقم المشروع", "رقم الجوب", "رقم العمل", "كود المشروع"],
  job_name: ["Job Name", "Project Name", "Name", "اسم المشروع", "اسم الجوب", "اسم العمل"],
  branch_name: ["Branch Name", "Branch", "الفرع", "اسم الفرع"],
  total_boxes: ["Total Boxes", "Total Box", "Boxes", "No of Boxes", "عدد الصناديق", "اجمالي الصناديق", "اجمالي عدد الصناديق", "عدد العلب", "اجمالي العلب"],
  total_documents: ["Total Documents", "Total Document", "Documents", "Total Docs", "No of Documents", "عدد المستندات", "اجمالي المستندات", "اجمالي عدد المستندات", "عدد الوثائق", "اجمالي الوثائق"],
  total_sheets: ["Total Sheets", "Total Sheet", "Sheets", "No of Sheets", "عدد الاوراق", "اجمالي الاوراق", "اجمالي عدد الاوراق", "عدد الصفحات", "اجمالي الصفحات"],
  date_of_delivery: ["Date Of Delivery", "Date Delivery", "Delivery Date", "Date Print", "Print Date", "تاريخ التسليم", "تاريخ الطباعه", "تاريخ الطباعة"],
};
const ALIAS_CANON: Record<Field, Set<string>> = Object.fromEntries(
  FIELDS.map(f => [f, new Set(ALIASES[f].map(canon))])
) as any;

// Fallback when no exact alias matches: header merely *contains* a keyword.
const CONTAINS: Partial<Record<Field, string[]>> = {
  job_id: ["jobid", "رقمالمشروع"],
  total_documents: ["document", "docs", "مستند", "وثيق", "وثائق"],
  total_sheets: ["sheet", "ورق", "اوراق", "صفح"],
  total_boxes: ["box", "صندوق", "صناديق", "علب"],
  date_of_delivery: ["deliver", "تسليم", "تسلم", "dateprint", "طباع"],
  branch_name: ["branch", "فرع"],
  job_name: ["jobname", "projectname", "اسمالمشروع"],
};

export type Mapping = Record<Field, string | null>;

export function mapHeaders(headers: string[]): Mapping {
  const m = Object.fromEntries(FIELDS.map(f => [f, null])) as Mapping;
  const used = new Set<string>();
  const cn = headers.map(h => [h, canon(h)] as const).filter(([, c]) => c);
  // pass 1: exact alias matches
  for (const f of FIELDS) for (const [h, c] of cn) if (!used.has(h) && ALIAS_CANON[f].has(c)) { m[f] = h; used.add(h); break; }
  // pass 2: keyword fallback for whatever is still missing
  for (const f of FIELDS) {
    if (m[f]) continue;
    const kws = (CONTAINS[f] || []).map(canon);
    for (const [h, c] of cn) if (!used.has(h) && kws.some(k => c.includes(k))) { m[f] = h; used.add(h); break; }
  }
  return m;
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩", PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
export function parseNumber(v: any): number | null {
  if (v === "" || v === null || v === undefined) return null;
  if (typeof v === "number") { if (!Number.isFinite(v) || v < 0) throw new Error(`Invalid numeric value: ${v}`); return Math.trunc(v); }
  let s = String(v).normalize("NFKC").trim();
  if (!s || s === "-" || s === "—") return null;
  s = s.replace(/[٠-٩]/g, d => String(ARABIC_DIGITS.indexOf(d))).replace(/[۰-۹]/g, d => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[\s,،٬ ]/g, "");
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid numeric value: ${v}`);
  return Math.trunc(n);
}

export function parseDate(v: any): string | null {
  if (v === null || v === undefined || v === "") return null;
  const p2 = (n: number) => String(n).padStart(2, "0");
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : `${v.getFullYear()}-${p2(v.getMonth() + 1)}-${p2(v.getDate())}`;
  if (typeof v === "number") { // Excel serial day number (1900 system)
    if (!Number.isFinite(v) || v < 1) return null;
    const d = new Date(Math.round((v - 25569) * 86400000)); return `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())}`; }
  const s = String(v).trim(); if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/); // Egyptian style day/month/year
  if (dmy) return `${dmy[3]}-${p2(+dmy[2])}-${p2(+dmy[1])}`;
  const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export type Parsed = {
  sheetName: string; headerRow: number; sourceRows: number; mapping: Mapping;
  items: any[]; duplicates: number[]; errors: { row: number; error: string }[];
  nullCounts: Record<string, number>; warnings: string[];
  sheets: { name: string; rows: number; min: number; max: number; in_boxes: number }[];
};

// Reads one sheet as an array of rows, finds the header row (first 15 rows), maps columns.
function readSheet(ws: XLSX.WorkSheet) {
  const grid = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: "", blankrows: false, raw: true });
  for (let i = 0; i < Math.min(grid.length, 15); i++) {
    const headers = grid[i].map(x => String(x ?? "").trim());
    const m = mapHeaders(headers.filter(Boolean));
    if (m.job_id) return { grid, hi: i, headers, mapping: m };
  }
  return null;
}

const BOX_START = 35150; // first Job ID covered by the box allocation rule (lib/alloc.ts)
// Every sheet that has a Job ID column, with the Job ID range it holds and how many IDs fall inside the box rule.
export function scanSheets(wb: XLSX.WorkBook) {
  const out: Parsed["sheets"] = [];
  for (const name of wb.SheetNames) {
    const r = readSheet(wb.Sheets[name]); if (!r) continue;
    const ci = r.headers.indexOf(r.mapping.job_id as string);
    const ids = r.grid.slice(r.hi + 1).map(x => Number(String(x[ci] ?? "").replace(/[^0-9]/g, ""))).filter(n => n > 0 && n < 1e6);
    if (!ids.length) continue;
    out.push({ name, rows: ids.length, min: Math.min(...ids), max: Math.max(...ids), in_boxes: ids.filter(n => n >= BOX_START).length });
  }
  return out;
}

export function parseWorkbook(wb: XLSX.WorkBook, wanted?: string): Parsed {
  const sheets = scanSheets(wb);
  const preferred = ["البيانات (2)", "بيانات المشاريع"];
  const order = [...preferred.filter(n => wb.SheetNames.includes(n)), ...wb.SheetNames.filter(n => !preferred.includes(n))];
  // prefer a sheet that has the ID column AND at least one totals column; then any sheet with an ID column
  let best: { name: string; r: NonNullable<ReturnType<typeof readSheet>> } | null = null;
  const seen: string[] = [];
  if (wanted && wb.SheetNames.includes(wanted)) { const r = readSheet(wb.Sheets[wanted]); if (!r) throw Object.assign(new Error(`Sheet "${wanted}" has no Job ID column.`), { status: 422 }); best = { name: wanted, r }; }
  else {
    // No sheet chosen: use the sheet whose Job IDs fall inside the box allocation rule (most of them); otherwise fall back to the preferred names.
    const top = [...sheets].sort((a, b) => b.in_boxes - a.in_boxes)[0];
    if (top && top.in_boxes > 0) { const r = readSheet(wb.Sheets[top.name]); if (r) best = { name: top.name, r }; }
  }
  if (!best) for (const name of order) {
    const r = readSheet(wb.Sheets[name]); if (!r) { seen.push(name); continue; }
    const totals = [r.mapping.total_boxes, r.mapping.total_documents, r.mapping.total_sheets].filter(Boolean).length;
    if (totals > 0) { best = { name, r }; break; }
    if (!best) best = { name, r };
  }
  if (!best) throw Object.assign(new Error(`Job ID column not found in any sheet (checked: ${order.join(", ")}).`), { status: 422 });
  const { name: sheetName, r } = best;
  const { grid, hi, headers, mapping } = r;
  const idx = (h: string | null) => (h ? headers.indexOf(h) : -1);
  const col = Object.fromEntries(FIELDS.map(f => [f, idx(mapping[f])])) as Record<Field, number>;

  const items: any[] = [], errors: { row: number; error: string }[] = [], duplicates: number[] = [];
  const seenIds = new Set<number>();
  const nullCounts: Record<string, number> = Object.fromEntries(FIELDS.map(f => [f, 0]));
  const dataRows = grid.slice(hi + 1);
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i], rowNo = hi + 2 + i;
    const get = (f: Field) => (col[f] >= 0 ? row[col[f]] : "");
    try {
      const rawId = String(get("job_id") ?? "").trim(); if (!rawId) continue;
      const id = parseNumber(rawId);
      if (id === null || id <= 0) throw new Error(`Invalid Job ID: ${rawId}`);
      if (seenIds.has(id)) { duplicates.push(id); continue; }
      seenIds.add(id);
      const payload: Record<string, any> = {};
      headers.forEach((h, k) => { if (h) payload[h] = row[k] instanceof Date ? parseDate(row[k]) : row[k]; });
      const it = {
        job_id: id,
        job_name: String(get("job_name") ?? "").trim() || null,
        branch_name: String(get("branch_name") ?? "").trim() || null,
        total_boxes: parseNumber(get("total_boxes")),
        total_documents: parseNumber(get("total_documents")),
        total_sheets: parseNumber(get("total_sheets")),
        date_of_delivery: parseDate(get("date_of_delivery")),
        source_payload: payload,
      };
      for (const f of FIELDS) if ((it as any)[f] === null) nullCounts[f]++;
      items.push(it);
    } catch (e) { errors.push({ row: rowNo, error: e instanceof Error ? e.message : "Invalid row" }); }
  }

  const warnings: string[] = [];
  const label: Record<string, string> = { total_boxes: "Total Boxes", total_documents: "Total Documents", total_sheets: "Total Sheets" };
  for (const f of ["total_boxes", "total_documents", "total_sheets"] as Field[]) {
    if (!mapping[f]) warnings.push(`Column for "${label[f]}" was NOT found in sheet "${sheetName}" — numbers would be saved empty. Found columns: ${headers.filter(Boolean).join(" | ")}`);
    else if (items.length && nullCounts[f] === items.length) warnings.push(`Column "${mapping[f]}" (${label[f]}) is empty/non-numeric in every row.`);
  }
  return { sheets, sheetName, headerRow: hi + 1, sourceRows: dataRows.length, mapping, items, duplicates, errors, nullCounts, warnings };
}
