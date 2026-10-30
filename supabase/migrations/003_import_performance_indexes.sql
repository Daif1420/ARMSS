-- Performance indexes for Excel import and automatic box allocation.
-- Safe to run on an existing database; does not modify or delete project data.
create index if not exists projects_unassigned_job_id_idx
  on public.projects(job_id)
  where box_id is null and job_id >= 35150;

create index if not exists import_row_changes_import_id_idx
  on public.import_row_changes(import_id);

create index if not exists dossiers_box_number_idx
  on public.dossiers(box_id, dossier_number);
