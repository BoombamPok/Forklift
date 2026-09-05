-- Schema refinements the real Godrej/Voltas master catalogue data
-- revealed were missing, ahead of importing it (see
-- supabase/reference-data/godrej-voltas-master-catalogue.csv and
-- scripts/import-master-catalogue.mjs). Brought forward from Phase 5
-- at the user's request, since the data is real and available now.

-- fuel_type is genuinely constant per model in the source data (every
-- part row for a given model agrees), so it's safe to normalize here.
alter table public.catalogue_models
  add column fuel_type text;

-- sub_category/assembly_group are finer-grained than `categories` and
-- worth keeping as-is (not normalized into their own table yet - no
-- feature needs that today). capacity_range_kg is stored verbatim as
-- given per part row rather than derived into a single per-model
-- number - the source data expresses it as a range across whichever
-- models a given part happens to list, and inferring one canonical
-- number per model risks stating something as fact that wasn't
-- actually given (CLAUDE.md #13).
alter table public.catalogue_parts
  add column sub_category text,
  add column assembly_group text,
  add column is_fastener boolean not null default false,
  add column capacity_range_kg text;

-- A part can legitimately appear across more than one source catalogue
-- (14 of the 284 real rows do) - one nullable FK on catalogue_parts
-- can't express that, so this replaces it with a proper join table.
alter table public.catalogue_parts drop column source_id;

create table public.catalogue_part_sources (
  id uuid primary key default gen_random_uuid(),
  catalogue_part_id uuid not null references public.catalogue_parts (id) on delete cascade,
  source_id uuid not null references public.catalogue_sources (id),
  created_at timestamptz not null default now(),
  unique (catalogue_part_id, source_id)
);

create index catalogue_part_sources_catalogue_part_id_idx on public.catalogue_part_sources (catalogue_part_id);
create index catalogue_part_sources_source_id_idx on public.catalogue_part_sources (source_id);

alter table public.catalogue_part_sources enable row level security;

create policy "Authenticated users can view catalogue_part_sources"
  on public.catalogue_part_sources for select to authenticated using (true);
create policy "Managers can insert into catalogue_part_sources"
  on public.catalogue_part_sources for insert to authenticated
  with check (public.current_user_role() in ('admin', 'manager'));
create policy "Managers can update catalogue_part_sources"
  on public.catalogue_part_sources for update to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));
