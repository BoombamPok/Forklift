# Architecture decisions

Short records of decisions worth remembering the reasoning behind - not a
full design log. See the main `README.md` for the general architecture
overview.

- [0001 — Catalogue and inventory are separate schema zones](0001-catalogue-inventory-separation.md)
- [0002 — Inventory quantity is trigger-maintained, never written directly](0002-quantity-via-movement-ledger.md)
- [0003 — V1 ships light-theme-only, with a fixed dark sidebar](0003-light-only-v1-fixed-sidebar-chrome.md)
- [0004 — Server Components + Server Actions, no separate API layer](0004-server-components-and-actions-only.md)
- [0005 — Use Supabase's publishable/secret keys, not legacy anon/service_role](0005-supabase-publishable-secret-keys.md)
- [0006 — No self-signup — accounts are admin-provisioned](0006-no-self-signup.md)
- [0007 — Server-enforced attribution, and no `for all` RLS policies](0007-server-enforced-attribution-and-no-for-all-policies.md)
- [0008 — Imported the real Godrej/Voltas master catalogue ahead of Phase 5](0008-real-catalogue-import.md)
- [0009 — `inventory_parts.min_stock` as a nullable low-stock threshold](0009-inventory-min-stock-threshold.md)
- [0010 — Inventory value KPI uses cost basis, not retail value](0010-inventory-valuation-cost-basis.md)
