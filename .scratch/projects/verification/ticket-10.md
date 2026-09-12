# Ticket 10 — Upload preview verification

Implemented a stateless, guarded multipart parse route and Project upload screen.
Parser fixtures are synthesized with the SheetJS writer; no developer workbook is
stored in the repository. Workbook contents are never persisted by the parse route.

## Targeted evidence

- Backend: 13 passing tests across the parser (5) and HTTP route (8). Coverage
  includes BIFF8 `.xls`, `.xlsx`, single/shared-column Blocks, cached formulas,
  merged Units, numeric/text labels, reversed Storey order, empty sheets,
  authentication, unknown Project, missing/invalid/oversize upload, text disguised
  as `.xlsx`, and OpenAPI registration. Sparse oversized dimensions are rejected
  using populated-cell bounds and bounded merge work rather than trusting `!ref`.
- Frontend: 2 passing presentational component tests, with adjacent stories.
- Browser: 4 passing Chromium tests with an isolated Vite server on port 5183.
  Covers actions, Projects sidebar state, upload, default sheet, sheet switch,
  accordion behavior, pending state, inline parse failure with retained file,
  unauthenticated redirect, and a phone viewport with internal table scrolling.
- Isolated browser server denied font requests through shared node_modules
  symlinks, so the phone test used fallback fonts. Main-workspace combined browser
  checks should verify the final typography.
- Backend and frontend TypeScript checks pass; targeted ESLint passes without
  warnings. Frontend production build passes (existing bundle-size/vendor
  annotation warnings remain).
- Dependency installation and lockfile integrity passed centrally. Audit is
  unchanged at 15 pre-existing advisories (8 moderate, 5 high, 2 critical), with
  zero added package/advisory pairs. See prerequisites.md and the existing
  dependency-audit follow-up. This is not a clean-audit claim.

## Integration notes

The preview contract is `UnitMatrixPreview` / `UnitMatrixBlock`, matching the spec.
The pure backend parser is `parseUnitMatrix(Buffer)` in services/unit-matrix.ts.
The frontend upload route is `/projects/$id/upload`. `apiRequest` omits its JSON
Content-Type for FormData, allowing the browser to supply the multipart boundary.

Ticket 11 adds selection/commit; 12 adds correction; 13 adds awkward-layout rules
and warnings. Main-agent integration and combined checks remain the integration
owner's responsibility. zh-CN retains its machine-translation flag.
