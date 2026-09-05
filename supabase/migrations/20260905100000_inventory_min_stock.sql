-- Phase 2a: low-stock threshold for the dashboard KPI (phase2a.md #4.1).
-- Nullable, no default - null means "no threshold configured", distinct
-- from a threshold of 0. Existing rows must stay null, not silently
-- become "never low stock" via a 0 default.
alter table public.inventory_parts
  add column min_stock integer
  check (min_stock is null or min_stock >= 0);

comment on column public.inventory_parts.min_stock is 'Quantity at or below which this part is considered low stock. Null means no threshold has been configured for this part (see docs/decisions/0009).';
