create extension if not exists pgcrypto;

create type public.unit_status as enum ('occupied', 'vacant', 'fit-out');
create type public.installation_state as enum ('live', 'commissioning', 'scheduled');
create type public.drawing_status as enum ('queued', 'uploading', 'uploaded', 'failed');
create type public.scope_code as enum ('A', 'B', 'C', 'D', 'E', 'F');

create table public.sites (
  id uuid primary key default gen_random_uuid(), name text not null check (length(trim(name)) > 0),
  description text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.storeys (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites(id) on delete restrict,
  name text not null check (length(trim(name)) > 0), number integer not null, level_from numeric not null,
  level_to numeric not null, structural_note text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint storeys_level_order check (level_to > level_from), unique(site_id, number), unique(id, site_id)
);
create table public.floor_plans (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites(id) on delete restrict,
  storey_id uuid not null, name text not null check (length(trim(name)) > 0), code text not null check (length(trim(code)) > 0),
  slab_level numeric not null, gross_area numeric not null check (gross_area >= 0), structural_grid text, source_drawing_id uuid,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (storey_id, site_id) references public.storeys(id, site_id) on delete restrict,
  unique(site_id, code), unique(id, site_id)
);
create table public.units (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites(id) on delete restrict,
  floor_plan_id uuid not null, code text not null check (length(trim(code)) > 0), room_tags text[] not null default '{}',
  usable_area numeric not null check (usable_area >= 0), ceiling_height numeric check (ceiling_height >= 0), entry_door text,
  boundary_note text, boundary_type text, grid_reference text, status public.unit_status not null default 'vacant',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (floor_plan_id, site_id) references public.floor_plans(id, site_id) on delete restrict,
  unique(site_id, code), unique(id, site_id)
);
create table public.installations (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites(id) on delete restrict,
  unit_id uuid not null, equipment text not null, model text, asset_tag text not null, location_in_unit text,
  installed_date date, state public.installation_state not null default 'scheduled',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (unit_id, site_id) references public.units(id, site_id) on delete restrict, unique(site_id, asset_tag)
);
create table public.subcontractors (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites(id) on delete restrict,
  company_name text not null, trade text not null, contact_person text, phone text, email text, contract_reference text,
  default_scope_codes public.scope_code[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id, site_id)
);
create table public.scope_assignments (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites(id) on delete restrict,
  subcontractor_id uuid not null, unit_id uuid not null, scope_code public.scope_code not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (subcontractor_id, site_id) references public.subcontractors(id, site_id) on delete restrict,
  foreign key (unit_id, site_id) references public.units(id, site_id) on delete restrict,
  unique(subcontractor_id, unit_id, scope_code)
);
create table public.drawings (
  id uuid primary key default gen_random_uuid(), site_id uuid not null references public.sites(id) on delete restrict,
  floor_plan_id uuid, name text not null, storage_path text not null unique, size_bytes bigint not null check (size_bytes >= 0),
  mime_type text, discipline text, revision text, status public.drawing_status not null default 'queued',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (floor_plan_id, site_id) references public.floor_plans(id, site_id) on delete restrict,
  unique(id, site_id)
);
alter table public.floor_plans add constraint floor_plans_source_drawing_fk foreign key (source_drawing_id, site_id) references public.drawings(id, site_id) on delete restrict;

create function public.set_updated_at() returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
do $$ declare table_name text; begin foreach table_name in array array['sites','storeys','floor_plans','units','installations','subcontractors','scope_assignments','drawings'] loop
  execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()', table_name);
end loop; end $$;

do $$ declare table_name text; begin foreach table_name in array array['sites','storeys','floor_plans','units','installations','subcontractors','scope_assignments','drawings'] loop
  execute format('alter table public.%I enable row level security', table_name);
  execute format('create policy "Administrators can read %1$I" on public.%1$I for select to authenticated using (true)', table_name);
  execute format('create policy "Administrators can insert %1$I" on public.%1$I for insert to authenticated with check (true)', table_name);
  execute format('create policy "Administrators can update %1$I" on public.%1$I for update to authenticated using (true) with check (true)', table_name);
  execute format('create policy "Administrators can delete %1$I" on public.%1$I for delete to authenticated using (true)', table_name);
end loop; end $$;

insert into storage.buckets (id, name, public) values ('drawings', 'drawings', false) on conflict (id) do update set public = false;
create policy "Administrators can read drawings" on storage.objects for select to authenticated using (bucket_id = 'drawings');
create policy "Administrators can upload drawings" on storage.objects for insert to authenticated with check (bucket_id = 'drawings');
create policy "Administrators can update drawings" on storage.objects for update to authenticated using (bucket_id = 'drawings') with check (bucket_id = 'drawings');
create policy "Administrators can delete drawings" on storage.objects for delete to authenticated using (bucket_id = 'drawings');
