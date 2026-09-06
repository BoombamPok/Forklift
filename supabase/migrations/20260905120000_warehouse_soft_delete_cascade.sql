-- Phase 4 (Warehouse Management), §5's resolved decision: soft-deleting a
-- warehouse/rack/shelf cascades onto everything beneath it (shelves/boxes),
-- since the existing FK `on delete cascade` only fires on a hard delete and
-- this app never hard-deletes. The cascade must happen atomically and must
-- never silently orphan an inventory_part's box_id, so each level is one
-- Postgres function (called via `.rpc()`, same calling convention as
-- log_audit_event) that:
--   1. finds every still-active inventory_part anywhere in the subtree
--      being removed;
--   2. if any exist, returns them and changes nothing;
--   3. otherwise performs the whole cascade in one transaction and returns
--      zero rows.
-- The caller (features/warehouse/actions.ts) tells the two outcomes apart
-- by whether the result set is empty, and shows the caller exactly which
-- parts are blocking so they can be reassigned/transferred first.
--
-- SECURITY INVOKER (the default - not declared `security definer` like
-- log_audit_event) so the existing RLS write policies on
-- warehouses/racks/shelves/boxes still apply. The explicit role check
-- below exists anyway, matching guard_inventory_quantity()'s precedent,
-- so a non-admin/manager caller gets a clear exception instead of an
-- UPDATE that silently touches zero rows under RLS.

create or replace function public.soft_delete_box(p_box_id uuid)
returns table (part_id uuid, part_number text, name text)
language plpgsql
as $$
begin
  if public.current_user_role() not in ('admin', 'manager') then
    raise exception 'only admin/manager can delete a box';
  end if;

  return query
    select ip.id, ip.part_number, ip.name
    from public.inventory_parts ip
    where ip.box_id = p_box_id
      and ip.deleted_at is null;

  if found then
    return;
  end if;

  update public.boxes set deleted_at = now()
  where id = p_box_id and deleted_at is null;
end;
$$;

create or replace function public.soft_delete_shelf(p_shelf_id uuid)
returns table (part_id uuid, part_number text, name text)
language plpgsql
as $$
begin
  if public.current_user_role() not in ('admin', 'manager') then
    raise exception 'only admin/manager can delete a shelf';
  end if;

  return query
    select ip.id, ip.part_number, ip.name
    from public.inventory_parts ip
    join public.boxes b on b.id = ip.box_id
    where b.shelf_id = p_shelf_id
      and ip.deleted_at is null;

  if found then
    return;
  end if;

  update public.boxes set deleted_at = now()
  where shelf_id = p_shelf_id and deleted_at is null;

  update public.shelves set deleted_at = now()
  where id = p_shelf_id and deleted_at is null;
end;
$$;

create or replace function public.soft_delete_rack(p_rack_id uuid)
returns table (part_id uuid, part_number text, name text)
language plpgsql
as $$
begin
  if public.current_user_role() not in ('admin', 'manager') then
    raise exception 'only admin/manager can delete a rack';
  end if;

  return query
    select ip.id, ip.part_number, ip.name
    from public.inventory_parts ip
    join public.boxes b on b.id = ip.box_id
    join public.shelves s on s.id = b.shelf_id
    where s.rack_id = p_rack_id
      and ip.deleted_at is null;

  if found then
    return;
  end if;

  update public.boxes set deleted_at = now()
  where shelf_id in (select id from public.shelves where rack_id = p_rack_id)
    and deleted_at is null;

  update public.shelves set deleted_at = now()
  where rack_id = p_rack_id and deleted_at is null;

  update public.racks set deleted_at = now()
  where id = p_rack_id and deleted_at is null;
end;
$$;

create or replace function public.soft_delete_warehouse(p_warehouse_id uuid)
returns table (part_id uuid, part_number text, name text)
language plpgsql
as $$
begin
  if public.current_user_role() not in ('admin', 'manager') then
    raise exception 'only admin/manager can delete a warehouse';
  end if;

  return query
    select ip.id, ip.part_number, ip.name
    from public.inventory_parts ip
    join public.boxes b on b.id = ip.box_id
    join public.shelves s on s.id = b.shelf_id
    join public.racks r on r.id = s.rack_id
    where r.warehouse_id = p_warehouse_id
      and ip.deleted_at is null;

  if found then
    return;
  end if;

  update public.boxes set deleted_at = now()
  where shelf_id in (
    select s.id from public.shelves s
    join public.racks r on r.id = s.rack_id
    where r.warehouse_id = p_warehouse_id
  ) and deleted_at is null;

  update public.shelves set deleted_at = now()
  where rack_id in (select id from public.racks where warehouse_id = p_warehouse_id)
    and deleted_at is null;

  update public.racks set deleted_at = now()
  where warehouse_id = p_warehouse_id and deleted_at is null;

  update public.warehouses set deleted_at = now()
  where id = p_warehouse_id and deleted_at is null;
end;
$$;

grant execute on function public.soft_delete_box(uuid) to authenticated;
grant execute on function public.soft_delete_shelf(uuid) to authenticated;
grant execute on function public.soft_delete_rack(uuid) to authenticated;
grant execute on function public.soft_delete_warehouse(uuid) to authenticated;
