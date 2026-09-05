-- Keeps inventory_parts.quantity as a maintained running total instead of
-- summing the ledger on every read (CLAUDE.md #18 performance + #5 audit),
-- and makes that the *only* way quantity can change.

create or replace function public.apply_stock_movement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory_parts
  set quantity = quantity + new.quantity_change
  where id = new.inventory_part_id;

  if not found then
    raise exception 'inventory_parts row % not found', new.inventory_part_id;
  end if;

  return new;
end;
$$;

create trigger apply_stock_movement_trigger
  after insert on public.stock_movements
  for each row execute function public.apply_stock_movement();

-- Blocks direct `UPDATE inventory_parts SET quantity = ...`. A change made
-- from inside apply_stock_movement() above is nested one trigger deeper
-- (pg_trigger_depth() >= 2) than a top-level UPDATE (depth 1), which is
-- how this tells the two apart.
create or replace function public.guard_inventory_quantity()
returns trigger
language plpgsql
as $$
begin
  if new.quantity <> old.quantity and pg_trigger_depth() <= 1 then
    raise exception 'inventory_parts.quantity cannot be changed directly - insert a stock_movements row instead';
  end if;
  return new;
end;
$$;

create trigger guard_inventory_quantity_trigger
  before update on public.inventory_parts
  for each row execute function public.guard_inventory_quantity();
