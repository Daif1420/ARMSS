-- ARMS schema v1. Apply to a NEW Supabase project via SQL Editor.
-- Imports preserve existing status and archive placement. Changed rows are flagged for review.
create extension if not exists pgcrypto;

do $$ begin create type public.archive_status as enum
('Pending','In Progress','Completed','Missing','On Hold','Ready for Delivery','Delivered');
exception when duplicate_object then null; end $$;
do $$ begin create type public.box_status as enum
('Open','In Progress','Completed','Closed','Ready for Delivery','Delivered');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null,
 role text not null default 'User' check(role in ('System Manager','Supervisor','User')),
 created_at timestamptz not null default now()
);
create table if not exists public.archive_boxes(
 id uuid primary key default gen_random_uuid(),
 box_code text unique not null,
 first_job_id bigint,
 last_job_id bigint,
 status public.box_status not null default 'Open',
 closed_at timestamptz,
 closed_by uuid references public.profiles(id),
 override_reason text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.dossiers(
 id uuid primary key default gen_random_uuid(),
 box_id uuid not null references public.archive_boxes(id) on delete restrict,
 dossier_number smallint not null check(dossier_number between 1 and 6),
 first_job_id bigint,
 last_job_id bigint,
 status public.archive_status not null default 'Pending',
 created_at timestamptz not null default now(),
 unique(box_id,dossier_number)
);
create table if not exists public.projects(
 id uuid primary key default gen_random_uuid(),
 job_id bigint unique not null,
 job_name text,
 branch_name text,
 total_boxes integer,
 total_documents bigint,
 total_sheets bigint,
 date_of_delivery date,
 box_id uuid references public.archive_boxes(id) on delete restrict,
 dossier_id uuid references public.dossiers(id) on delete restrict,
 status public.archive_status not null default 'Pending',
 archive_flag boolean not null default false,
 import_state text not null default 'New' check(import_state in ('New','Existing','Changed','Review')),
 source_payload jsonb not null default '{}'::jsonb,
 last_seen_import_id uuid,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint project_dossier_requires_box check(box_id is null or dossier_id is not null)
);
create index if not exists projects_status_idx on public.projects(status);
create index if not exists projects_branch_idx on public.projects(branch_name);
create index if not exists projects_box_idx on public.projects(box_id);
create index if not exists projects_import_state_idx on public.projects(import_state);
create index if not exists projects_unassigned_job_id_idx on public.projects(job_id) where box_id is null and job_id >= 35150;

create table if not exists public.import_batches(
 id uuid primary key default gen_random_uuid(),
 file_name text not null,
 sheet_name text not null,
 total_rows integer not null default 0,
 valid_rows integer not null default 0,
 new_rows integer not null default 0,
 changed_rows integer not null default 0,
 unchanged_rows integer not null default 0,
 duplicate_rows integer not null default 0,
 error_rows integer not null default 0,
 created_by uuid references public.profiles(id),
 created_at timestamptz not null default now(),
 details jsonb not null default '{}'::jsonb
);
create table if not exists public.import_row_changes(
 id bigint generated always as identity primary key,
 import_id uuid not null references public.import_batches(id) on delete cascade,
 job_id bigint,
 change_type text not null check(change_type in ('New','Changed','Unchanged','Duplicate','Invalid','MissingFromUpload')),
 before_data jsonb,
 incoming_data jsonb,
 note text,
 created_at timestamptz not null default now()
);
create index if not exists import_row_changes_import_id_idx on public.import_row_changes(import_id);
create index if not exists dossiers_box_number_idx on public.dossiers(box_id,dossier_number);
create table if not exists public.project_status_history(
 id bigint generated always as identity primary key,
 project_id uuid not null references public.projects(id) on delete restrict,
 old_status public.archive_status,
 new_status public.archive_status not null,
 changed_by uuid references public.profiles(id),
 reason text,
 changed_at timestamptz not null default now()
);
create table if not exists public.audit_logs(
 id bigint generated always as identity primary key,
 actor_id uuid references public.profiles(id),
 action text not null,
 entity_type text not null,
 entity_id text,
 reason text,
 before_data jsonb,
 after_data jsonb,
 created_at timestamptz not null default now()
);

-- Atomic import RPC (v2).
--  * New IDs are inserted.
--  * Existing projects: BLANK source fields (NULL) are filled from the file automatically (safe, nothing is overwritten).
--  * Existing projects with a DIFFERENT non-blank value are flagged 'Changed' for review, unless p_apply=true,
--    in which case the file's values replace the stored source values.
--  * Status and box/dossier placement are NEVER touched. Rows absent from a file are NOT marked Missing.
create or replace function public.arms_import_projects(
 p_file_name text,p_sheet_name text,p_rows jsonb,p_row_count integer,
 p_duplicate_job_ids bigint[] default '{}',p_row_errors jsonb default '[]'::jsonb,
 p_apply boolean default false
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 v_import_id uuid:=gen_random_uuid();
 v_item jsonb; v_job_id bigint; v_existing public.projects%rowtype;
 v_new integer:=0; v_changed integer:=0; v_unchanged integer:=0; v_filled integer:=0; v_applied integer:=0;
 v_duplicate integer:=coalesce(array_length(p_duplicate_job_ids,1),0);
 v_total integer:=0; v_change text; v_before jsonb; v_incoming jsonb;
 i_name text; i_branch text; i_boxes integer; i_docs bigint; i_sheets bigint; i_date date; i_payload jsonb;
 v_diff boolean; v_fill boolean;
begin
 if jsonb_typeof(p_rows)<>'array' then raise exception 'p_rows must be a JSON array'; end if;
 insert into import_batches(id,file_name,sheet_name,total_rows,valid_rows,duplicate_rows,error_rows,details)
 values(v_import_id,p_file_name,p_sheet_name,p_row_count,jsonb_array_length(p_rows),v_duplicate,jsonb_array_length(coalesce(p_row_errors,'[]'::jsonb)),
 jsonb_build_object('duplicate_job_ids',to_jsonb(coalesce(p_duplicate_job_ids,'{}'::bigint[])),'row_errors',coalesce(p_row_errors,'[]'::jsonb),'apply',p_apply));
 for v_item in select value from jsonb_array_elements(p_rows) loop
  v_total:=v_total+1;
  v_job_id:=(v_item->>'job_id')::bigint;
  i_name:=nullif(v_item->>'job_name',''); i_branch:=nullif(v_item->>'branch_name','');
  i_boxes:=nullif(v_item->>'total_boxes','')::integer; i_docs:=nullif(v_item->>'total_documents','')::bigint;
  i_sheets:=nullif(v_item->>'total_sheets','')::bigint; i_date:=nullif(v_item->>'date_of_delivery','')::date;
  i_payload:=coalesce(v_item->'source_payload','{}'::jsonb);
  v_incoming:=jsonb_build_object('job_id',v_job_id,'job_name',i_name,'branch_name',i_branch,'total_boxes',i_boxes,'total_documents',i_docs,'total_sheets',i_sheets,'date_of_delivery',i_date,'source_payload',i_payload);
  select * into v_existing from projects where job_id=v_job_id for update;
  if not found then
   insert into projects(job_id,job_name,branch_name,total_boxes,total_documents,total_sheets,date_of_delivery,source_payload,import_state,last_seen_import_id)
   values(v_job_id,i_name,i_branch,i_boxes,i_docs,i_sheets,i_date,i_payload,'New',v_import_id);
   v_new:=v_new+1; v_change:='New'; v_before:=null;
  else
   v_before:=jsonb_build_object('job_name',v_existing.job_name,'branch_name',v_existing.branch_name,'total_boxes',v_existing.total_boxes,'total_documents',v_existing.total_documents,'total_sheets',v_existing.total_sheets,'date_of_delivery',v_existing.date_of_delivery,'source_payload',v_existing.source_payload);
   -- a real difference = stored value is non-blank AND incoming is non-blank AND they differ
   v_diff:=(v_existing.job_name is not null and i_name is not null and v_existing.job_name<>i_name)
        or (v_existing.branch_name is not null and i_branch is not null and v_existing.branch_name<>i_branch)
        or (v_existing.total_boxes is not null and i_boxes is not null and v_existing.total_boxes<>i_boxes)
        or (v_existing.total_documents is not null and i_docs is not null and v_existing.total_documents<>i_docs)
        or (v_existing.total_sheets is not null and i_sheets is not null and v_existing.total_sheets<>i_sheets)
        or (v_existing.date_of_delivery is not null and i_date is not null and v_existing.date_of_delivery<>i_date);
   -- stored value blank, file has a value -> can be filled safely
   v_fill:=(v_existing.job_name is null and i_name is not null) or (v_existing.branch_name is null and i_branch is not null)
        or (v_existing.total_boxes is null and i_boxes is not null) or (v_existing.total_documents is null and i_docs is not null)
        or (v_existing.total_sheets is null and i_sheets is not null) or (v_existing.date_of_delivery is null and i_date is not null);
   if p_apply and (v_diff or v_fill) then
      update projects set job_name=coalesce(i_name,job_name),branch_name=coalesce(i_branch,branch_name),total_boxes=coalesce(i_boxes,total_boxes),
        total_documents=coalesce(i_docs,total_documents),total_sheets=coalesce(i_sheets,total_sheets),date_of_delivery=coalesce(i_date,date_of_delivery),
        source_payload=i_payload,import_state='Existing',last_seen_import_id=v_import_id,updated_at=now() where id=v_existing.id;
      v_applied:=v_applied+1; v_change:='Changed';
   else
      if v_fill then
        update projects set job_name=coalesce(job_name,i_name),branch_name=coalesce(branch_name,i_branch),total_boxes=coalesce(total_boxes,i_boxes),
          total_documents=coalesce(total_documents,i_docs),total_sheets=coalesce(total_sheets,i_sheets),date_of_delivery=coalesce(date_of_delivery,i_date),
          source_payload=i_payload,updated_at=now() where id=v_existing.id;
        v_filled:=v_filled+1;
      end if;
      if v_diff then
        update projects set import_state='Changed',last_seen_import_id=v_import_id,updated_at=now() where id=v_existing.id;
        v_changed:=v_changed+1; v_change:='Changed';
      else
        update projects set import_state=case when import_state in ('Changed','Review') then import_state else 'Existing' end,last_seen_import_id=v_import_id where id=v_existing.id;
        v_unchanged:=v_unchanged+1; v_change:='Unchanged';
      end if;
   end if;
  end if;
  insert into import_row_changes(import_id,job_id,change_type,before_data,incoming_data)
  values(v_import_id,v_job_id,v_change,v_before,v_incoming);
 end loop;
 update import_batches set new_rows=v_new,changed_rows=v_changed+v_applied,unchanged_rows=v_unchanged where id=v_import_id;
 insert into audit_logs(action,entity_type,entity_id,after_data)
 values('Excel import','import_batch',v_import_id::text,jsonb_build_object('file',p_file_name,'sheet',p_sheet_name,'rows',v_total,'new',v_new,'changed',v_changed,'applied',v_applied,'filled_blanks',v_filled,'unchanged',v_unchanged));
 return jsonb_build_object('import_id',v_import_id,'total_valid_rows',v_total,'new',v_new,'changed',v_changed,'applied',v_applied,'filled_blanks',v_filled,'unchanged',v_unchanged,'duplicate_rows',v_duplicate,'invalid_rows',jsonb_array_length(coalesce(p_row_errors,'[]'::jsonb)));
end $$;

revoke all on function public.arms_import_projects(text,text,jsonb,integer,bigint[],jsonb,boolean) from public, anon, authenticated;
grant execute on function public.arms_import_projects(text,text,jsonb,integer,bigint[],jsonb,boolean) to service_role;

-- Enable RLS. Add role-aware policies before connecting client-side access.
alter table public.profiles enable row level security;
alter table public.archive_boxes enable row level security;
alter table public.dossiers enable row level security;
alter table public.projects enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_row_changes enable row level security;
alter table public.project_status_history enable row level security;
alter table public.audit_logs enable row level security;
