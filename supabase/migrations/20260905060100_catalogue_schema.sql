-- Catalogue zone: "what parts exist and what do they fit?" - see
-- CLAUDE.md #3 for why this stays separate from the inventory zone.

create table public.catalogue_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

comment on table public.catalogue_sources is 'Provenance of catalogue data (e.g. a specific consolidation report) - see CLAUDE.md #13/#43 on not fabricating or silently upgrading confidence.';

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger set_updated_at
  before update on public.brands
  for each row execute function public.set_updated_at();

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create table public.catalogue_model_families (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.brands (id),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (brand_id, name)
);

create index catalogue_model_families_brand_id_idx on public.catalogue_model_families (brand_id);

create trigger set_updated_at
  before update on public.catalogue_model_families
  for each row execute function public.set_updated_at();

create table public.catalogue_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands (id),
  model_family_id uuid references public.catalogue_model_families (id),
  name text not null,
  model_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (brand_id, name)
);

create index catalogue_models_brand_id_idx on public.catalogue_models (brand_id);
create index catalogue_models_model_family_id_idx on public.catalogue_models (model_family_id);
create index catalogue_models_name_idx on public.catalogue_models (name);

create trigger set_updated_at
  before update on public.catalogue_models
  for each row execute function public.set_updated_at();

-- "unverified" is the safe default - nothing here should read as verified
-- until a human or trusted source has actually confirmed it.
create table public.catalogue_parts (
  id uuid primary key default gen_random_uuid(),
  part_number text not null,
  name text not null,
  brand_id uuid references public.brands (id),
  category_id uuid references public.categories (id),
  source_id uuid references public.catalogue_sources (id),
  oem_reference text,
  description text,
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified', 'uncertain')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on column public.catalogue_parts.part_number is 'Business identifier, not a primary key (CLAUDE.md #11) - intentionally not unique on its own, since duplicate detection/merging is a deliberate app workflow, not a DB constraint.';

create index catalogue_parts_part_number_idx on public.catalogue_parts (part_number);
create index catalogue_parts_oem_reference_idx on public.catalogue_parts (oem_reference);
create index catalogue_parts_brand_id_idx on public.catalogue_parts (brand_id);
create index catalogue_parts_category_id_idx on public.catalogue_parts (category_id);

create trigger set_updated_at
  before update on public.catalogue_parts
  for each row execute function public.set_updated_at();

create table public.cross_refs (
  id uuid primary key default gen_random_uuid(),
  catalogue_part_id uuid not null references public.catalogue_parts (id) on delete cascade,
  cross_reference_number text not null,
  source text,
  created_at timestamptz not null default now()
);

create index cross_refs_catalogue_part_id_idx on public.cross_refs (catalogue_part_id);
create index cross_refs_cross_reference_number_idx on public.cross_refs (cross_reference_number);

-- Join table: a part can fit many models, a model can take many parts.
create table public.compatibility (
  id uuid primary key default gen_random_uuid(),
  catalogue_part_id uuid not null references public.catalogue_parts (id) on delete cascade,
  catalogue_model_id uuid not null references public.catalogue_models (id) on delete cascade,
  source_id uuid references public.catalogue_sources (id),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified', 'verified', 'uncertain')),
  notes text,
  created_at timestamptz not null default now(),
  unique (catalogue_part_id, catalogue_model_id)
);

create index compatibility_catalogue_part_id_idx on public.compatibility (catalogue_part_id);
create index compatibility_catalogue_model_id_idx on public.compatibility (catalogue_model_id);
