-- Hardening pass from a Phase 1 code review, applied before Phase 2 starts.
-- Fixes four real gaps between documented intent and what the schema
-- actually enforced:
--   1. Catalogue/warehouse write policies used `for all`, which includes
--      DELETE - contradicting the soft-delete-only design.
--   2. inventory_parts.quantity could be set to any value on INSERT,
--      bypassing the movement ledger entirely (the UPDATE guard already
--      in place never fires for INSERT).
--   3. Staff could soft-delete inventory_parts via UPDATE despite
--      lib/permissions/index.ts withholding inventory.delete from staff.
--   4. stock_movements.created_by / part_images.uploaded_by were
--      client-supplied and unchecked, making ledger attribution spoofable.
-- Also: tightens log_audit_event's grant, and adds indexes that were
-- missing on the ledger tables' FK columns.

-- ---------------------------------------------------------------------
-- 1. Replace `for all` write policies with INSERT/UPDATE only (no DELETE)
--    on every catalogue/warehouse table, per the soft-delete design.
-- ---------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'catalogue_sources', 'brands', 'categories', 'catalogue_model_families',
    'catalogue_models', 'catalogue_parts', 'cross_refs', 'compatibility',
    'warehouses', 'racks', 'shelves', 'boxes'
  ]
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      'Managers can write ' || t, t
    );
    execute format(
      $p$create policy %I on public.%I for insert to authenticated
        with check (public.current_user_role() in ('admin', 'manager'))$p$,
      'Managers can insert into ' || t, t
    );
    execute format(
      $p$create policy %I on public.%I for update to authenticated
        using (public.current_user_role() in ('admin', 'manager'))
        with check (public.current_user_role() in ('admin', 'manager'))$p$,
      'Managers can update ' || t, t
    );
  end loop;
end;
$$;

-- ---------------------------------------------------------------------
-- 2 & 3. inventory_parts: force quantity to 0 on INSERT (opening stock
--    must go through stock_movements, same as every other change), and
--    block anyone but admin/manager from changing deleted_at.
-- ---------------------------------------------------------------------

create or replace function public.guard_inventory_quantity()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    if new.quantity <> 0 then
      raise exception 'inventory_parts must be created with quantity 0 - insert a stock_movements row for opening stock';
    end if;
    return new;
  end if;

  if new.quantity <> old.quantity and pg_trigger_depth() <= 1 then
    raise exception 'inventory_parts.quantity cannot be changed directly - insert a stock_movements row instead';
  end if;

  if new.deleted_at is distinct from old.deleted_at
     and public.current_user_role() not in ('admin', 'manager') then
    raise exception 'only admin/manager can delete or restore inventory_parts';
  end if;

  return new;
end;
$$;

drop trigger if exists guard_inventory_quantity_trigger on public.inventory_parts;
create trigger guard_inventory_quantity_trigger
  before insert or update on public.inventory_parts
  for each row execute function public.guard_inventory_quantity();

-- ---------------------------------------------------------------------
-- 4. Force ledger/upload attribution server-side - a client can no
--    longer claim an action was performed by a different user.
-- ---------------------------------------------------------------------

create or replace function public.set_actor_column()
returns trigger
language plpgsql
as $$
begin
  if tg_argv[0] = 'created_by' then
    new.created_by := auth.uid();
  elsif tg_argv[0] = 'uploaded_by' then
    new.uploaded_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists set_stock_movement_actor on public.stock_movements;
create trigger set_stock_movement_actor
  before insert on public.stock_movements
  for each row execute function public.set_actor_column('created_by');

drop trigger if exists set_part_image_actor on public.part_images;
create trigger set_part_image_actor
  before insert on public.part_images
  for each row execute function public.set_actor_column('uploaded_by');

-- ---------------------------------------------------------------------
-- 5. read_only never performs a write log_audit_event would record.
--    `grant execute ... to authenticated` can't express an app-level
--    role check by itself (admin/manager/staff/read_only all map to the
--    same Postgres `authenticated` role - the distinction lives in
--    public.profiles), so the check has to live inside the function.
--    Full action/entity-name validation stays the calling application's
--    responsibility, per phase1.md #34's guidance against over-engineering
--    the audit system.
-- ---------------------------------------------------------------------

create or replace function public.log_audit_event(
  p_action text,
  p_entity_type text,
  p_entity_id uuid,
  p_previous_state jsonb default null,
  p_new_state jsonb default null,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() = 'read_only' then
    raise exception 'read_only cannot write audit events';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, previous_state, new_state, reason)
  values (auth.uid(), p_action, p_entity_type, p_entity_id, p_previous_state, p_new_state, p_reason);
end;
$$;

-- ---------------------------------------------------------------------
-- 6. Missing indexes on ledger FK columns.
-- ---------------------------------------------------------------------

create index if not exists stock_movements_from_box_id_idx on public.stock_movements (from_box_id);
create index if not exists stock_movements_to_box_id_idx on public.stock_movements (to_box_id);
create index if not exists stock_movements_created_by_idx on public.stock_movements (created_by);
create index if not exists audit_logs_actor_id_idx on public.audit_logs (actor_id);
