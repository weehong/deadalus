# 02: Database schema and seed, and the Building structure screen (read)

**What to build:** After the Administrator (you) applies the migration and seed, the Building structure screen shows the real Site: the page heading carries its name; the tree lists every storey, the floor plans under each and the units under each plan, with kind, label and contained count, expanding and collapsing; selecting a storey or floor plan (kept in the URL, defaulting to the first storey) shows its detail card — storey: number, levels, derived height, plan and unit counts, structural note, last edited; floor plan: code, slab level, storey height, gross area, units, source drawing, grid, last edited — and a child table (floor plans of a storey; units of a floor plan) whose "Open" selects a plan or goes to the unit route. A Site with no storeys shows an empty state; a project with no Site shows "no Site configured". While in Blueprints the sidebar foot shows the Site's drawing count and total size.

The **entire schema ships here in one migration** so it is applied once: all eight tables with constraints, enumerations, `updated_at` triggers, row-level security for authenticated Administrators, and the private drawings bucket with its policies; plus a dev-only seed of the fictional Harbourline Tower · Block B data. The hand-written Database type, the per-entity data modules (all eight, read and write functions — writes are exercised from ticket 03 on) and the query hooks follow ADR-0003. Components take data as props; the page wires hooks.

**Blocked by:** 01 (Blueprints section in the sidebar, its routes, and the shared primitives)

**Status:** complete (migration/seed require manual application; Playwright coverage written)

- [ ] One migration creating sites, storeys, floor_plans, units, installations, subcontractors, scope_assignments, drawings with the agreed fields, uniqueness per Site, level ordering and non-negative checks, restrict-on-delete parents, updated_at triggers, RLS, and the drawings bucket with policies
- [ ] Dev-only seed with the prototype's Site, storeys, plans, units, installations, subcontractors and assignments, marked fictional; README/spec note on how to apply
- [ ] Hand-written Database type matching the migration, with a regenerate note
- [ ] Per-entity data modules and query hooks keyed by Site and entity; screens never import the client
- [ ] Blueprints layout resolves the first Site and renders the "no Site configured" state when none
- [ ] Structure screen: tree with expand/collapse, URL-held selection defaulting to the first storey, detail card per kind, child table with Open actions, empty state
- [ ] Sidebar foot shows drawing count and total size inside Blueprints
- [ ] Unit tests: tree, detail card, child tables by props; routes test for selection in URL
- [ ] End-to-end (written): REST intercepted — structure renders seeded-shaped data, selection survives reload
- [ ] Lint, typecheck, unit tests and build green
