# 08: The Field's Project, Block, Storey and Unit drill-down

**What to build:** A signed-in Member sees the Projects where their Subcontractor holds Items, each with code, name, Item count and the Subcontractor's own Progression; with none, the screen says no work is assigned yet. Opening a Project walks Blocks, then Storeys, then Units, one level per screen on a phone with the selection in search params `block` and `storey`; each row shows the Subcontractor's Item count and Progression, and only Blocks, Storeys and Units where it holds Items appear. A Unit row opens the Unit screen (ticket 09). Loading, empty and error-with-retry states are present.

Underneath: `GET /api/v1/field/projects` and `GET /api/v1/field/projects/:id` behind `requireMember`, with counts and Progression from the roll-up query module filtered to the Member's Subcontractor, empty nodes omitted, 404 for a Project where it holds nothing or an unknown id. Nothing in the request names the Subcontractor.

Spec: `.scratch/items-and-progression/spec.md`. ADR-0003 applies.

**Blocked by:** 06 (Progression on Structure rows and the Projects list), 07 (Member sign-in to the Field)

**Status:** complete

- [x] The Projects read lists only Projects with the Subcontractor's Items, ordered by name key, with counts and Progression over its Items only; covered at the HTTP seam
- [x] The Project read omits Blocks, Storeys and Units holding none of its Items, and is a 404 where it holds none in the Project or for an unknown id
- [x] Both routes appear in the OpenAPI document
- [x] The Field list rows are presentational components with a story and a test
- [x] The screens work one-handed at phone width with no sideways scrolling and 44px targets, in both locales
- [x] The Field e2e fake implements both reads and the e2e spec covers the list, the empty list, the drill-down and a stale link to a Project outside the Subcontractor

## Comments

### 2026-09-12 — implementation evidence (ticket agent)

Backend
- `src/services/progress.service.ts`: the per-Project grouping behind `readProjectRollups` is now a private `readRollupsByProject(where)`, shared with the new `readSubcontractorRollups(subcontractorId)` (one query: the Subcontractor's Items rolled up per Project), so the Field's list uses the roll-up module rather than a second copy. `readProjectRollups` is unchanged in contract.
- `src/schemas/field-projects.schema.ts`: `fieldProjectRowSchema`, `fieldProjectSchema` (Blocks → Storeys → Units, each `id`, `name`, `itemCount ≥ 1`, `progression` never null) and `fieldProjectParametersSchema`.
- `src/services/field-projects.service.ts`: `listFieldProjects(subcontractorId)` (roll-ups first; no Project query at all when it holds nothing; then `project.findMany` by id ordered by name key then id) and `readFieldProject(id, subcontractorId)` (lean Structure select in position-then-id order plus `readUnitItemRows({ projectId, subcontractorId })`; the pure `toFieldProject` fold drops every Unit, Storey and Block holding none of the Subcontractor's Items and returns null for the whole Project, which becomes the same `404 Project not found` as an unknown id). Nothing takes a Subcontractor id from the request.
- `src/controllers/field.controller.ts`: `listFieldProjectsController`, `readFieldProjectController` (Subcontractor from `request.member` via a shared `memberOf` guard). `src/routes/field.route.ts`: `GET /projects`, `GET /projects/:id` behind `requireMember`. `src/openapi/registry.ts`: `FieldProjectRow`, `FieldProject` and both paths under the Field tag with `memberBearerAuth` (200/401, and 404 on the read).
- `pnpm --filter @daedalus/backend exec vitest run tests/integration/field-projects.route.test.ts` — 11 passed (red first: 11 failed). Boundary fakes honour the `subcontractorId` and Project scope of each query: list restricted to the Member's Subcontractor and ordered by name key (Aurora then Gardens; Zeta, where it holds nothing, absent from the `id in` query); a second Subcontractor's token sees its own Projects with `?subcontractorId=` and a body ignored; an idle Subcontractor gets `[]` with no Project query; 401 without a token and for an Administrator's Supabase token; the read keeps Structure order and omits Block B, Unit u2 and Storey 03 for Acme while Beacon sees Block B through its own Items; exact shape (no `position`, `entryCount` or `unitTypeId`); 404 for a Project where it holds nothing and for an unknown id, identical bodies; 401 without a token; OpenAPI tags, scheme and responses.
- With the neighbours: `vitest run tests/integration/field-projects.route.test.ts tests/integration/field-sessions.route.test.ts tests/integration/projects.route.test.ts tests/integration/project-detail.route.test.ts tests/unit/progress.service.test.ts` — 52 passed. `pnpm --filter @daedalus/backend typecheck` and `lint` — clean.

Frontend
- `features/field/types.ts` (`FieldProjectRow`, `FieldProject`/`FieldBlock`/`FieldStorey`/`FieldUnit`), `api.ts` (`fetchFieldProjects`, `fetchFieldProject` over `fieldFetch`, so a 401 still ends the Session), `useFieldProjectsQuery.ts` and `useFieldProjectQuery.ts` (keyed by token so one Member's work never shows for the next).
- `FieldRowList.tsx` (presentational; story `Field/FieldRowList` with Projects/Blocks/Units, test with 2 cases): one column of `min-h-[44px]` link rows, each with an optional code line, the name, "{{count}} Item(s)" and the reused `ProgressionBadge` from `features/projects`; a row links to a Project (with `block`/`storey` in the search params) or to `/field/units/$unitId`.
- `FieldProjectsPage.tsx` replaces the placeholder: loading (`role="status"`), error `Alert` with a 44px Retry, the existing "No work assigned yet" empty state, or the list. `FieldProjectPage.tsx` at `routes/_field/field.projects.$id.tsx` (`validateSearch` for `block`/`storey`): Blocks, then the selected Block's Storeys, then the selected Storey's Units, one level per screen with a back link at each level; a stale `block`/`storey` falls back a level; a 404 shows "This Project is not in your work…" with Back to Projects; other errors show Retry. `FieldUnitPage.tsx` at `routes/_field/field.units.$unitId.tsx` is a "not built yet" placeholder with a way back, for ticket 09 to replace. `routeTree.gen.ts` regenerated by the Vite plugin (`vite build`).
- Strings under `field.projects`, `field.rows`, `field.project` and `field.unit` in en-US and zh-CN (zh-CN machine-translated).
- `pnpm --filter @daedalus/frontend exec vitest run src/features/field` — 5 files, 24 passed. `typecheck` and `lint --max-warnings 0` — clean.
- e2e: `e2e/field-api.ts` gains a Subcontractor-scoped work fixture (`fieldWorkFixtures`: each Unit lists the Progression of the Items held there; the fake derives counts, averages, omission of empty nodes, name-key order and the 404 itself), `interceptField(page, members, work = [])` (existing callers unchanged), both reads behind the same bearer check as `me`, and `failNextProjectRead()`. New `e2e/field-drill-down.spec.ts` at 390×844 — 7 passed: the list (bearer on the request, no Subcontractor in it, Aurora then Gardens with code/name/"1 Item"/"3 Items"/0%/73%, Zeta absent, 44px rows, no sideways scroll); the empty list; the walk Gardens → Block A only (B omitted) → Storeys 01/02 with counts → Unit 01 only, its link to `/field/units/unit-a2-01` and the placeholder, then Back to Storeys/Blocks/Projects with the URL losing each selection; a deep link opening the Units level and a stale `block` falling back to Blocks; a stale link to Zeta as a 404 state with Back to Projects while still signed in; a 500 on the Project and on the list each recovered by Retry; Chinese through list, Blocks, Storeys, Units and the 404.
- `pnpm --filter @daedalus/frontend exec playwright test e2e/field-drill-down.spec.ts e2e/field-auth.spec.ts --project=chromium` — 17 passed (7 new + the 10 existing auth specs, untouched).

Notes for the parent
- Shared files touched with string edits only: `apps/backend/src/openapi/registry.ts`, `apps/backend/src/routes/field.route.ts`, `apps/backend/src/controllers/field.controller.ts`, `apps/backend/src/services/progress.service.ts`, both `translations.json`, `apps/frontend/e2e/field-api.ts` (rewritten, contract preserved). Generated: `apps/frontend/src/routeTree.gen.ts`. No migration, env var or seed change.
- Ticket 09 replaces `features/field/FieldUnitPage.tsx` (and may keep its route file); the Unit's Items read can follow `field-projects.service.ts` for the 404 rule and the `authenticate` helper in the e2e fake for its routes.

