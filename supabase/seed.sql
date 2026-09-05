-- ============================================================
-- Development seed data - NOT real business data.
-- ============================================================
-- Everything here is fictional/placeholder (see the "Sample "/"Demo "
-- naming) per CLAUDE.md #13 and phase1.md #42/#43 - never treat this as
-- validated catalogue data. The real catalogue is imported later through
-- a controlled process once source data exists.
--
-- Intended to run once against a freshly-migrated database (e.g. via
-- `supabase db reset`), not repeatedly - inventory_parts/stock_movements
-- have no natural unique key to make re-runs idempotent.

insert into public.brands (name) values
  ('Sample Brand A'),
  ('Sample Brand B')
on conflict (name) do nothing;

insert into public.categories (name) values
  ('Sample Category - Filters'),
  ('Sample Category - Hydraulics'),
  ('Sample Category - Electrical')
on conflict (name) do nothing;

insert into public.catalogue_model_families (brand_id, name)
select id, 'Sample Model Family 1'
from public.brands
where name = 'Sample Brand A'
on conflict (brand_id, name) do nothing;

insert into public.catalogue_models (brand_id, model_family_id, name, model_code)
select b.id, f.id, 'Sample Model X100', 'X100'
from public.brands b
join public.catalogue_model_families f
  on f.brand_id = b.id and f.name = 'Sample Model Family 1'
where b.name = 'Sample Brand A'
on conflict (brand_id, name) do nothing;

-- Catalogue + inventory part.
insert into public.catalogue_parts (part_number, name, brand_id, category_id, verification_status)
select 'SAMPLE-0001', 'Sample Oil Filter', b.id, c.id, 'unverified'
from public.brands b, public.categories c
where b.name = 'Sample Brand A' and c.name = 'Sample Category - Filters';

insert into public.compatibility (catalogue_part_id, catalogue_model_id, verification_status)
select p.id, m.id, 'unverified'
from public.catalogue_parts p, public.catalogue_models m
where p.part_number = 'SAMPLE-0001' and m.name = 'Sample Model X100'
on conflict (catalogue_part_id, catalogue_model_id) do nothing;

-- Catalogue-only part: exists in the catalogue, deliberately never stocked.
insert into public.catalogue_parts (part_number, name, brand_id, category_id, verification_status)
select 'SAMPLE-0002', 'Sample Hydraulic Seal (catalogue only)', b.id, c.id, 'unverified'
from public.brands b, public.categories c
where b.name = 'Sample Brand B' and c.name = 'Sample Category - Hydraulics';

insert into public.warehouses (name) values ('Demo Warehouse')
on conflict (name) do nothing;

insert into public.racks (warehouse_id, code)
select id, 'R01' from public.warehouses where name = 'Demo Warehouse'
on conflict (warehouse_id, code) do nothing;

insert into public.shelves (rack_id, code)
select r.id, 'S01'
from public.racks r
join public.warehouses w on w.id = r.warehouse_id
where w.name = 'Demo Warehouse' and r.code = 'R01'
on conflict (rack_id, code) do nothing;

insert into public.boxes (shelf_id, code)
select s.id, 'B01'
from public.shelves s
join public.racks r on r.id = s.rack_id
join public.warehouses w on w.id = r.warehouse_id
where w.name = 'Demo Warehouse' and r.code = 'R01' and s.code = 'S01'
on conflict (shelf_id, code) do nothing;

insert into public.boxes (shelf_id, code)
select s.id, 'B02'
from public.shelves s
join public.racks r on r.id = s.rack_id
join public.warehouses w on w.id = r.warehouse_id
where w.name = 'Demo Warehouse' and r.code = 'R01' and s.code = 'S01'
on conflict (shelf_id, code) do nothing;

insert into public.inventory_parts (catalogue_part_id, part_number, name, box_id, purchase_cost, selling_price)
select p.id, p.part_number, p.name, b.id, 12.50, 19.99
from public.catalogue_parts p
join public.boxes b on true
join public.shelves s on s.id = b.shelf_id
join public.racks r on r.id = s.rack_id
join public.warehouses w on w.id = r.warehouse_id
where p.part_number = 'SAMPLE-0001'
  and w.name = 'Demo Warehouse' and r.code = 'R01' and s.code = 'S01' and b.code = 'B01';

insert into public.stock_movements (inventory_part_id, movement_type, quantity_change, to_box_id, reason)
select ip.id, 'in', 10, ip.box_id, 'Initial demo stock'
from public.inventory_parts ip
where ip.part_number = 'SAMPLE-0001';

-- Inventory-only part: physically stocked, no catalogue linkage.
insert into public.inventory_parts (part_number, name, box_id, purchase_cost, selling_price)
select 'INV-ONLY-0001', 'Sample Inventory-Only Part', b.id, 5.00, 9.00
from public.boxes b
join public.shelves s on s.id = b.shelf_id
join public.racks r on r.id = s.rack_id
join public.warehouses w on w.id = r.warehouse_id
where w.name = 'Demo Warehouse' and r.code = 'R01' and s.code = 'S01' and b.code = 'B02';

insert into public.stock_movements (inventory_part_id, movement_type, quantity_change, to_box_id, reason)
select ip.id, 'in', 25, ip.box_id, 'Initial demo stock'
from public.inventory_parts ip
where ip.part_number = 'INV-ONLY-0001';
