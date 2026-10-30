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

-- Atomic import RPC. New IDs are inserted; changed source fields are flagged and logged
-- but do not overwrite project status or archive placement. Missing rows are NOT marked
-- missing merely because they are absent from an uploaded file.
create or replace function public.arms_import_projects(
 p_file_name text,p_sheet_name text,p_rows jsonb,p_row_count integer,
 p_duplicate_job_ids bigint[] default '{}',p_row_errors jsonb default '[]'::jsonb
) returns jsonb language plpgsql security definer set search_path=public as $$
declare
 v_import_id uuid:=gen_random_uuid();
 v_item jsonb; v_job_id bigint; v_existing public.projects%rowtype;
 v_new integer:=0; v_changed integer:=0; v_unchanged integer:=0;
 v_duplicate integer:=coalesce(array_length(p_duplicate_job_ids,1),0);
 v_total integer:=0; v_change text; v_before jsonb; v_incoming jsonb;
begin
 if jsonb_typeof(p_rows)<>'array' then raise exception 'p_rows must be a JSON array'; end if;
 insert into import_batches(id,file_name,sheet_name,total_rows,valid_rows,duplicate_rows,error_rows,details)
 values(v_import_id,p_file_name,p_sheet_name,p_row_count,jsonb_array_length(p_rows),v_duplicate,jsonb_array_length(coalesce(p_row_errors,'[]'::jsonb)),
 jsonb_build_object('duplicate_job_ids',to_jsonb(coalesce(p_duplicate_job_ids,'{}'::bigint[])),'row_errors',coalesce(p_row_errors,'[]'::jsonb)));
 for v_item in select value from jsonb_array_elements(p_rows) loop
  v_total:=v_total+1;
  v_job_id:=(v_item->>'job_id')::bigint;
  v_incoming:=jsonb_build_object('job_id',v_job_id,'job_name',nullif(v_item->>'job_name',''),'branch_name',nullif(v_item->>'branch_name',''),'total_boxes',nullif(v_item->>'total_boxes','')::integer,'total_documents',nullif(v_item->>'total_documents','')::bigint,'total_sheets',nullif(v_item->>'total_sheets','')::bigint,'date_of_delivery',nullif(v_item->>'date_of_delivery','')::date,'source_payload',coalesce(v_item->'source_payload','{}'::jsonb));
  select * into v_existing from projects where job_id=v_job_id for update;
  if not found then
   insert into projects(job_id,job_name,branch_name,total_boxes,total_documents,total_sheets,date_of_delivery,source_payload,import_state,last_seen_import_id)
   values(v_job_id,nullif(v_item->>'job_name',''),nullif(v_item->>'branch_name',''),nullif(v_item->>'total_boxes','')::integer,nullif(v_item->>'total_documents','')::bigint,nullif(v_item->>'total_sheets','')::bigint,nullif(v_item->>'date_of_delivery','')::date,coalesce(v_item->'source_payload','{}'::jsonb),'New',v_import_id);
   v_new:=v_new+1; v_change:='New'; v_before:=null;
  else
   v_before:=jsonb_build_object('job_name',v_existing.job_name,'branch_name',v_existing.branch_name,'total_boxes',v_existing.total_boxes,'total_documents',v_existing.total_documents,'total_sheets',v_existing.total_sheets,'date_of_delivery',v_existing.date_of_delivery,'source_payload',v_existing.source_payload);
   if v_existing.job_name is distinct from nullif(v_item->>'job_name','')
    or v_existing.branch_name is distinct from nullif(v_item->>'branch_name','')
    or v_existing.total_boxes is distinct from nullif(v_item->>'total_boxes','')::integer
    or v_existing.total_documents is distinct from nullif(v_item->>'total_documents','')::bigint
    or v_existing.total_sheets is distinct from nullif(v_item->>'total_sheets','')::bigint
    or v_existing.date_of_delivery is distinct from nullif(v_item->>'date_of_delivery','')::date
    or v_existing.source_payload is distinct from coalesce(v_item->'source_payload','{}'::jsonb) then
      update projects set import_state='Changed',last_seen_import_id=v_import_id,updated_at=now() where id=v_existing.id;
      v_changed:=v_changed+1; v_change:='Changed';
   else
      update projects set import_state=case when import_state in ('Changed','Review') then import_state else 'Existing' end,last_seen_import_id=v_import_id where id=v_existing.id;
      v_unchanged:=v_unchanged+1; v_change:='Unchanged';
   end if;
  end if;
  insert into import_row_changes(import_id,job_id,change_type,before_data,incoming_data)
  values(v_import_id,v_job_id,v_change,v_before,v_incoming);
 end loop;
 update import_batches set new_rows=v_new,changed_rows=v_changed,unchanged_rows=v_unchanged where id=v_import_id;
 insert into audit_logs(action,entity_type,entity_id,after_data)
 values('Excel import','import_batch',v_import_id::text,jsonb_build_object('file',p_file_name,'sheet',p_sheet_name,'rows',v_total,'new',v_new,'changed',v_changed,'unchanged',v_unchanged));
 return jsonb_build_object('import_id',v_import_id,'total_valid_rows',v_total,'new',v_new,'changed',v_changed,'unchanged',v_unchanged,'duplicate_rows',v_duplicate,'invalid_rows',jsonb_array_length(coalesce(p_row_errors,'[]'::jsonb)));
end $$;

-- RPC is restricted to service role; the route must remain server-side.
revoke all on function public.arms_import_projects(text,text,jsonb,integer,bigint[],jsonb) from public, anon, authenticated;
grant execute on function public.arms_import_projects(text,text,jsonb,integer,bigint[],jsonb) to service_role;

-- Enable RLS. Add role-aware policies before connecting client-side access.
alter table public.profiles enable row level security;
alter table public.archive_boxes enable row level security;
alter table public.dossiers enable row level security;
alter table public.projects enable row level security;
alter table public.import_batches enable row level security;
alter table public.import_row_changes enable row level security;
alter table public.project_status_history enable row level security;
alter table public.audit_logs enable row level security;
