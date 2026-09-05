-- RLS is the real security boundary (CLAUDE.md #37) - the TypeScript
-- capability model in src/lib/permissions mirrors this for UI gating only.
--
-- Pattern used throughout: SELECT open to any authenticated user, writes
-- gated by current_user_role(). Tables with a deleted_at column rely on
-- the same UPDATE policy for soft-delete (no separate DELETE policy is
-- granted, so hard deletes stay impossible from the app - CLAUDE.md #11).

-- ---------------------------------------------------------------------
-- Catalogue zone: admin/manager manage, everyone authenticated reads.
-- ---------------------------------------------------------------------

alter table public.catalogue_sources enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.catalogue_model_families enable row level security;
alter table public.catalogue_models enable row level security;
alter table public.catalogue_parts enable row level security;
alter table public.cross_refs enable row level security;
alter table public.compatibility enable row level security;

create policy "Authenticated users can view catalogue_sources"
  on public.catalogue_sources for select to authenticated using (true);
create policy "Managers can write catalogue_sources"
  on public.catalogue_sources for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view brands"
  on public.brands for select to authenticated using (true);
create policy "Managers can write brands"
  on public.brands for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view categories"
  on public.categories for select to authenticated using (true);
create policy "Managers can write categories"
  on public.categories for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view catalogue_model_families"
  on public.catalogue_model_families for select to authenticated using (true);
create policy "Managers can write catalogue_model_families"
  on public.catalogue_model_families for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view catalogue_models"
  on public.catalogue_models for select to authenticated using (true);
create policy "Managers can write catalogue_models"
  on public.catalogue_models for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view catalogue_parts"
  on public.catalogue_parts for select to authenticated using (true);
create policy "Managers can write catalogue_parts"
  on public.catalogue_parts for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view cross_refs"
  on public.cross_refs for select to authenticated using (true);
create policy "Managers can write cross_refs"
  on public.cross_refs for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view compatibility"
  on public.compatibility for select to authenticated using (true);
create policy "Managers can write compatibility"
  on public.compatibility for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

-- ---------------------------------------------------------------------
-- Warehouse structure: admin/manager manage, everyone authenticated reads.
-- ---------------------------------------------------------------------

alter table public.warehouses enable row level security;
alter table public.racks enable row level security;
alter table public.shelves enable row level security;
alter table public.boxes enable row level security;

create policy "Authenticated users can view warehouses"
  on public.warehouses for select to authenticated using (true);
create policy "Managers can write warehouses"
  on public.warehouses for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view racks"
  on public.racks for select to authenticated using (true);
create policy "Managers can write racks"
  on public.racks for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view shelves"
  on public.shelves for select to authenticated using (true);
create policy "Managers can write shelves"
  on public.shelves for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

create policy "Authenticated users can view boxes"
  on public.boxes for select to authenticated using (true);
create policy "Managers can write boxes"
  on public.boxes for all to authenticated
  using (public.current_user_role() in ('admin', 'manager'))
  with check (public.current_user_role() in ('admin', 'manager'));

-- ---------------------------------------------------------------------
-- Inventory: staff+ can create/edit; stock_movements is insert-only for
-- staff+ with no update/delete policy at all (immutable ledger).
-- ---------------------------------------------------------------------

alter table public.inventory_parts enable row level security;
alter table public.stock_movements enable row level security;
alter table public.part_images enable row level security;

create policy "Authenticated users can view inventory_parts"
  on public.inventory_parts for select to authenticated using (true);
create policy "Staff can create inventory_parts"
  on public.inventory_parts for insert to authenticated
  with check (public.current_user_role() in ('admin', 'manager', 'staff'));
create policy "Staff can update inventory_parts"
  on public.inventory_parts for update to authenticated
  using (public.current_user_role() in ('admin', 'manager', 'staff'))
  with check (public.current_user_role() in ('admin', 'manager', 'staff'));

create policy "Authenticated users can view stock_movements"
  on public.stock_movements for select to authenticated using (true);
create policy "Staff can record stock_movements"
  on public.stock_movements for insert to authenticated
  with check (public.current_user_role() in ('admin', 'manager', 'staff'));

create policy "Authenticated users can view part_images"
  on public.part_images for select to authenticated using (true);
create policy "Staff can add part_images"
  on public.part_images for insert to authenticated
  with check (public.current_user_role() in ('admin', 'manager', 'staff'));

-- ---------------------------------------------------------------------
-- Audit logs: written only via the security-definer log_audit_event()
-- function (see the audit-log-function migration), read by admin/manager.
-- ---------------------------------------------------------------------

alter table public.audit_logs enable row level security;

create policy "Admins and managers can view audit_logs"
  on public.audit_logs for select to authenticated
  using (public.current_user_role() in ('admin', 'manager'));
