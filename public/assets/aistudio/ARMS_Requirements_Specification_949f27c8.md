# ARMS — Intercom Archive Management System
## Product Requirements & Technical Specification

**Document version:** 1.0  
**Date:** 29 October 2026  
**Purpose:** Requirements for a practical production-ready archive management system for Intercom operational project reports.

---

## 1. Project Overview

ARMS manages the physical archive of Intercom project reports, from importing project data through box/dossier allocation, archiving, label generation, delivery, reporting, and user access control.

The application must be practical and reliable for daily operations. It should feel like a real enterprise application—not a generic AI-style dashboard.

### Core workflow

1. Upload the Excel workbook named `بيانات المشاريع`.
2. Validate and preview the imported data.
3. Identify new, existing, changed, duplicate, and invalid records.
4. Create/update project records without duplicating existing Job IDs.
5. Allocate projects to archive boxes and dossiers using the configured ranges.
6. Track project archive status and missing projects.
7. Complete and close boxes according to the closure rules.
8. Generate and print labels manually or automatically.
9. Deliver projects or boxes and record delivery status.
10. View operational KPIs and export reports.

---

## 2. Archive Allocation Rules

### Standard capacity

- One box contains **6 dossiers**.
- One dossier contains **50 projects**.
- Standard box capacity: **300 projects**.
- Project IDs are used to identify the project; archive allocation must not overwrite the original Job ID.
- Do not use gap-filling or automatic reassignment to shift existing projects into different ranges.
- Allocation ranges must be configurable and stored as system settings.

### Confirmed ranges

| Box | First Project | Last Project | Capacity |
|---|---:|---:|---:|
| D41 | 35150 | 35449 | 300 |
| D42 | 35500 | 35799 | 300 |

D42 starts at **35500**. Continue according to the approved allocation configuration. Do not infer or silently invent later box ranges where a gap or rule is not specified.

### Dossier ranges

For a 300-project box, each dossier represents 50 sequential archive positions:

| Dossier | Position Range |
|---|---|
| Dossier 1 | 1–50 |
| Dossier 2 | 51–100 |
| Dossier 3 | 101–150 |
| Dossier 4 | 151–200 |
| Dossier 5 | 201–250 |
| Dossier 6 | 251–300 |

The system must preserve the allocation identity and avoid moving projects between boxes/dossiers during a repeated import.

---

## 3. Excel Import

### Source workbook

The user uploads the operational workbook `بيانات المشاريع.xlsx`.

### Required field mapping

| Source field | Application field |
|---|---|
| Job ID | `job_id` |
| Job Name | `job_name` |
| Branch Name | `branch_name` |
| Total Box | `total_box` |
| Total Document | `total_document` |
| Total Sheets | `total_sheets` |
| Date Delivery | `date_print` |

The source field `Date Delivery` is mapped to the application field **Date Print**.

### Import process

1. Upload the file.
2. Read and map columns.
3. Validate required columns and data types.
4. Preview the results before committing.
5. Identify record categories.
6. Confirm import.
7. Store import batch details and results.

### Import KPIs / categories

- **New Projects:** Job IDs that have never appeared in the system.
- **Existing Projects:** Job IDs already in the system with no relevant data changes.
- **Changed Projects:** Existing Job IDs whose uploaded values differ from stored values.
- **Duplicate Projects:** Repeated Job IDs within the uploaded workbook.
- **Import Errors:** Rows that fail validation.
- **Pending Review:** Conflicts requiring user review.

### Re-import behavior

Use `Job ID` as the stable project identifier.

- A first-time Job ID is classified as **New**.
- A repeated Job ID must not create a duplicate project.
- An unchanged repeated record is classified as Existing.
- If a project is uploaded again with a changed status or other changed data, classify it as Changed and flag it for review.
- Do not automatically overwrite the stored project status when the uploaded status differs.
- Do not finalize the import while unresolved conflicts remain, unless an authorized user explicitly resolves or bypasses them according to configured permissions.
- Re-import must not silently alter a project's box/dossier allocation.
- Keep an import batch history and report the result of each import.

### Missing projects

Projects expected by the archive allocation but not present/confirmed in the physical archive must remain identifiable as Missing or Reserved according to the archive workflow. Missing projects must not be silently removed or cause the system to renumber/reallocate other projects.

---

## 4. Project Statuses

The system should support these statuses:

| Status | Meaning |
|---|---|
| Pending | Project has not started archive processing |
| In Progress | Archive processing is underway |
| Completed | Archive processing is complete |
| Missing | Expected project cannot be located/confirmed |
| On Hold | Processing is temporarily paused |
| Ready for Delivery | Project is ready to be delivered |
| Delivered | Project has been delivered |

Status changes must be permission-controlled and recorded in project status history.

### Delivery action

When a project is Completed, an authorized user can use **Deliver**.

On confirmation:

- Update status to Delivered.
- Record delivery date/time.
- Record the user who completed delivery.
- Preserve project and archive allocation details.
- Record the action in audit logs.

The application may support delivery by individual project and/or by complete box, according to the configured workflow and permissions.

---

## 5. Box and Dossier Management

### Boxes page

Show all boxes in a searchable, sortable, filterable table.

Recommended columns:

- Box Number
- Dossier Count
- Project Count
- Completed Projects
- Missing Projects
- Remaining Projects
- Progress
- Box Status
- Actions

Clicking anywhere on a box row opens its details.

### Box details

Show:

- Box number
- Total dossiers
- Total projects
- Completed projects
- Missing projects
- Remaining projects
- Progress bar
- Box status
- Dossier list

Each dossier shows its project count, completion progress, and status. Selecting a dossier opens its projects.

### Projects table inside a dossier

Columns, in this order:

1. Job ID
2. Job Name
3. Branch Name
4. Total Box
5. Total Document
6. Total Sheets
7. Date Print
8. Project Status
9. Actions

Selecting a project opens its details and status controls.

### Box closure rules

A box cannot be closed until all required dossiers and projects are complete and all required records are resolved.

When closure is blocked, show clear reasons, such as:

- Pending projects
- Missing projects
- Incomplete dossiers
- Unresolved import conflicts

**System Manager override:** A System Manager may close a box despite incomplete conditions. Require a confirmation and reason. Record the user, timestamp, and reason in Audit Logs. Do not mark incomplete projects as Completed automatically.

Allow authorized reopening of a closed box with a reason and audit entry.

---

## 6. Dashboard and KPIs

Dashboard KPIs must be clickable and open the corresponding filtered page/list.

### A. Project Volume KPIs — source project data

These represent project-volume values from the source project data, not archive completion:

- **Total Projects**
- **Total Documents** (`Total Document`)
- **Total Sheets**
- **Total Boxes** (the source project's `Total Box` field, calculated according to the approved aggregation rule)

### B. Archive KPIs — actual archive progress

These represent archive records and processing:

- Archived Projects
- Archived Documents
- Archived Sheets
- Archived Boxes
- Archived Dossiers
- Missing Projects
- Completed Projects
- Delivered Projects
- Pending Projects
- New Projects
- Open Boxes
- In Progress Boxes
- Completed Boxes
- Closed Boxes
- Ready for Delivery

Do not mix source-volume KPIs with archive KPIs. Clearly label the two groups.

### Dashboard components

- Project Volume summary
- Archive Progress summary
- Daily completed projects
- Daily delivery report
- Box completion overview
- Recent imports
- Projects requiring attention
- Archive progress charts

Avoid displaying invented/sample figures as live values. Use actual database values or neutral placeholders during development.

---

## 7. Search, Sorting, Filters, and Tables

All data tables throughout the application must support:

- Search
- Column sorting ascending and descending
- Alphabetical sorting A–Z / Z–A
- Numeric sorting
- Date sorting
- Filters appropriate to the page
- Multiple filters where useful
- Pagination
- Column visibility controls where practical
- Export of filtered results

Examples:

- Sort Job ID low-to-high or high-to-low.
- Sort Job Name A–Z or Z–A.
- Sort Date Print newest-to-oldest.
- Filter by branch, box, dossier, status, date, and delivery state.
- Search within filtered results.

---

## 8. Labels

The user has an existing label form/PDF. The application label must match that provided design and visual identity as closely as possible.

### Label requirements

- 100 × 50 mm label size
- Zebra printer support
- Code 128 barcode support where applicable
- Black-and-white label style
- Box and dossier labels should share the same identity
- Preview before printing
- Manual and automatic generation

### Automatic labels

If a box/dossier exists in the system, select it and populate its information automatically.

Actions:

- Print Box Label
- Print Dossier Labels
- Print All Labels
- Print Selected Labels
- Preview Before Printing

### Manual labels

If the box is not registered in the system, users with permission may generate a manual label.

Inputs:

- Box Number
- First Project Number
- Project Count

Calculate the final project number automatically:

`Last Project = First Project + Project Count - 1`

Prevent accidental overlapping allocations. Require elevated permission and an audit record if a manual label conflicts with registered allocation ranges.

### Uploaded label reference

The uploaded PDF is the design reference. Its displayed range may differ from the newly confirmed allocation configuration. Preserve the label design, but use the current approved range configuration for generated data.

---

## 9. Reports

Provide reports with search, filters, sorting, and export to Excel/PDF.

Required reports:

- Completed Projects
- Missing Projects
- Delivered Projects
- Pending Projects
- In Progress Projects
- Box Status Report
- Dossier Status Report
- Archive Summary
- Delivery Report
- Import History
- Import Errors / Conflicts
- User Activity Report
- Audit Logs

Report controls:

- Date range
- Box
- Dossier
- Branch
- Project status
- Delivery status
- Export Excel
- Export PDF
- Print

---

## 10. Users and Permissions

Support role-based access control and configurable permissions.

Suggested roles:

### System Manager
- Full system access
- Manage users and roles
- Manage settings
- Upload/import data
- Manage boxes and projects
- Override box closure with a required reason
- Reopen boxes
- Access reports and audit logs

### Supervisor
- Access assigned boxes/projects
- Update permitted project statuses
- Deliver projects if permitted
- Generate labels
- View/export permitted reports

### User
- View assigned data
- Perform only explicitly granted actions

User fields:

- User Name
- Full Name
- Role
- Status
- Last Login
- Assigned Boxes
- Assigned Dossiers

Hide tabs/actions that the current user is not authorized to use. Enforce permissions on the server/database as well as in the UI.

---

## 11. Audit Logs — No Activity Timeline

**Activity Timeline is removed** from project and box pages.

Keep a central **Audit Logs** page for important system events, including:

- Imports
- Project changes
- Status changes
- Delivery
- Box closure
- Manual closure overrides
- Box reopening
- Label generation where relevant
- User/permission changes
- Settings changes

Audit records should include:

- Actor/user
- Action
- Entity type and ID
- Timestamp
- Relevant before/after values
- Reason where required

Do not add a per-project or per-box Activity Timeline UI.

---

## 12. UI/UX Design

### Design direction

Apple-inspired, clean enterprise application. Avoid generic AI-looking dashboard layouts.

### Colors

| Token | Value |
|---|---|
| Primary | `#007AFF` |
| Secondary Blue | `#0A84FF` |
| Background | `#F5F5F7` |
| Card Background | `#FFFFFF` |
| Primary Text | `#1D1D1F` |
| Secondary Text | `#86868B` |
| Success | `#34C759` |
| Warning | `#FF9F0A` |
| Danger | `#FF3B30` |

Requirements:

- Top navigation bar, not a permanent sidebar
- Icon on every top-level tab
- Responsive navigation on smaller screens
- Light and dark modes
- Clean typography and whitespace
- Consistent status badges
- Useful tables and filters
- Clear confirmation dialogs for consequential actions
- Accessible contrast and keyboard-friendly controls

### Main navigation tabs

- Dashboard
- Boxes
- Projects
- Reports
- Import Data
- Labels
- Users
- Settings

Show tabs according to permissions.

---

## 13. Global Search and Operational Convenience

Provide global search from the main application shell.

Search by:

- Job ID
- Job Name
- Branch Name
- Box Number
- Dossier Number

Search results should display the project’s archive location in the standard hierarchy:

`Archive → Box → Dossier → Project`

This is a basic project-location display, **not a separate Archive Location Tracking module**. The dedicated Archive Location Tracking feature is removed.

Other useful features:

- Bulk actions with permission checks
- Import preview and conflict review
- Clear empty/error/loading states
- Confirmation before destructive or consequential actions
- Preserve allocation during re-import
- Export currently filtered data

---

## 14. Database Design

Recommended platform:

- Frontend: Next.js + TypeScript
- UI: Tailwind CSS + shadcn/ui
- Database: Supabase PostgreSQL
- Authentication: Supabase Auth
- Excel parsing: ExcelJS or SheetJS
- Hosting: Vercel

Suggested tables:

| Table | Purpose |
|---|---|
| users / profiles | User identity and roles |
| roles | Role definitions |
| permissions | Permission definitions |
| role_permissions | Role-to-permission mapping |
| boxes | Box records and status |
| dossiers | Dossier records and box relationship |
| projects | Project source data and archive assignment |
| project_status_history | Project status changes |
| box_status_history | Box status changes |
| deliveries | Delivery records |
| import_batches | Import batch metadata and outcomes |
| import_errors | Validation errors and conflicts |
| audit_logs | Central audit events |
| label_templates | Label configuration/reference |
| system_settings | Allocation and system configuration |

Keep source project fields separate from archive assignment and operational status. Preserve original Job IDs and source values.

---

## 15. Acceptance Criteria

The implementation is considered aligned with this specification when:

1. The user can upload the project workbook and preview validation results.
2. The system identifies New, Existing, Changed, Duplicate, and invalid records.
3. Re-uploading a project does not create a duplicate.
4. A changed project status is flagged for review and is not silently overwritten.
5. D41 and D42 use the confirmed ranges.
6. Each standard box has six dossiers and each dossier has 50 archive positions.
7. Box details open from the whole table row.
8. Project details open from the project row.
9. Box closure is blocked until required records are complete, except for authorized override.
10. Manual override requires a reason and is audited.
11. Project delivery updates status and records delivery details.
12. Labels support manual and automatic generation.
13. Dashboard clearly separates source project-volume KPIs from archive KPIs.
14. Every table supports sorting, search, and useful filters.
15. Reports can be filtered and exported.
16. Role permissions are enforced.
17. Activity Timeline is not present.
18. The dedicated Archive Location Tracking feature is not present.
19. The interface uses the specified Apple-inspired top-bar design.
20. No demo figures are presented as real operational data.

---

## 16. Items Requiring Configuration or Confirmation

Do not silently assume these details during implementation:

- Exact allocation rules for boxes after D42, if not explicitly configured.
- The aggregation rule for source `Total Box` KPI (sum, distinct count, or another agreed rule).
- Whether delivery is enabled per project, per box, or both.
- Exact import behavior for missing rows in a later workbook. A project absent from an upload must not automatically be deleted or marked Missing without an explicitly approved rule.
- Exact label layout details not readable from the uploaded PDF extraction. Use the visual PDF reference during implementation.
- Which project statuses are considered sufficient for a dossier or box to be complete.

---

**End of specification.**
