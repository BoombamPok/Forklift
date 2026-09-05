-- Inventory zone: "what do we physically own, where is it, and what
-- happened to it?" - see CLAUDE.md #3/#4. Warehouse hierarchy is
-- Warehouse -> Rack -> Shelf -> Box (CLAUDE.md #4), data-driven per
-- phase1.md #32 - no hard-coded rack/shelf/box counts anywhere here.

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create trigger set_updated_at
  before update on public.warehouses
  for each row execute function public.set_updated_at();

create table public.racks (
  id uuid primary key default gen_random_uuid(),
  warehouse_id uuid not null references public.warehouses (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (warehouse_id, code)
);

create index racks_warehouse_id_idx on public.racks (warehouse_id);

create trigger set_updated_at
  before update on public.racks
  for each row execute function public.set_updated_at();

create table public.shelves (
  id uuid primary key default gen_random_uuid(),
  rack_id uuid not null references public.racks (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (rack_id, code)
);

create index shelves_rack_id_idx on public.shelves (rack_id);

create trigger set_updated_at
  before update on public.shelves
  for each row execute function public.set_updated_at();

create table public.boxes (
  id uuid primary key default gen_random_uuid(),
  shelf_id uuid not null references public.shelves (id) on delete cascade,
  code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (shelf_id, code)
);

create index boxes_shelf_id_idx on public.boxes (shelf_id);

create trigger set_updated_at
  before update on public.boxes
  for each row execute function public.set_updated_at();

-- The optional catalogue link is the point (CLAUDE.md #3): catalogue-only,
-- catalogue+inventory, and inventory-only parts must all stay valid.
create table public.inventory_parts (
  id uuid primary key default gen_random_uuid(),
  catalogue_part_id uuid references public.catalogue_parts (id),
  part_number text not null,
  name text not null,
  box_id uuid references public.boxes (id),
  quantity integer not null default 0 check (quantity >= 0),
  purchase_cost numeric(12, 2),
  selling_price numeric(12, 2),
  status text not null default 'active'
    check (status in ('active', 'discontinued', 'damaged')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

comment on column public.inventory_parts.quantity is 'Maintained only by apply_stock_movement() (see the stock-movement-trigger migration) - never write to this column directly, insert a stock_movements row instead.';

create index inventory_parts_catalogue_part_id_idx on public.inventory_parts (catalogue_part_id);
create index inventory_parts_box_id_idx on public.inventory_parts (box_id);
create index inventory_parts_part_number_idx on public.inventory_parts (part_number);

create trigger set_updated_at
  before update on public.inventory_parts
  for each row execute function public.set_updated_at();

-- Insert-only ledger (CLAUDE.md #5) - RLS grants INSERT/SELECT only, never
-- UPDATE/DELETE, so history can't be silently rewritten.
create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_part_id uuid not null references public.inventory_parts (id),
  movement_type text not null
    check (movement_type in ('in', 'out', 'transfer', 'adjust', 'damaged', 'returned')),
  quantity_change integer not null,
  from_box_id uuid references public.boxes (id),
  to_box_id uuid references public.boxes (id),
  reason text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index stock_movements_inventory_part_id_idx on public.stock_movements (inventory_part_id);
create index stock_movements_created_at_idx on public.stock_movements (created_at);

create table public.part_images (
  id uuid primary key default gen_random_uuid(),
  inventory_part_id uuid not null references public.inventory_parts (id) on delete cascade,
  storage_path text not null,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index part_images_inventory_part_id_idx on public.part_images (inventory_part_id);

-- Straightforward audit log (phase1.md #34 explicitly warns against
-- over-engineering a generic event-sourcing system) - rows are written via
-- log_audit_event() (see the audit-log-function migration), not directly.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  previous_state jsonb,
  new_state jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_at_idx on public.audit_logs (created_at);
