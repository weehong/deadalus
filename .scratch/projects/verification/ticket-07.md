# Ticket 07 verification

Implementation covers multi-Storey Unit batches, optional Unit Type assignment,
inline Unit name/type editing and clearing, scoped deletion, OpenAPI, translated
forms, component stories, and the browser fake.

Targeted checks in the isolated worktree:

- Backend HTTP seam: 33 tests passed. Includes independently assigned positions,
  deduplicated clashes across Storeys, invalid names/Storey counts/product cap,
  every foreign scope, all three authentication guards, type-only changes and
  clearing, Serializable retry, unique-constraint conflict translation, and
  Unit Type deletion races returning scoped 404 after a narrow post-rollback check.
- Backend changed-file ESLint and complete TypeScript checking passed.
- Frontend changed-file ESLint and complete TypeScript checking passed.
- UnitBatchForm, UnitsPane and shared BatchNamesForm: 9 component tests passed.
  Coverage includes multiplied counts and limits, cross-Storey clash markers,
  type clearing, single add, Chinese controls, and edit/delete focus handling.
- Two new Chromium browser scenarios passed against the isolated worktree Vite
  server, with normal fonts permitted through a temporary filesystem allow-list.
  They exercise three-Storey typed batches, preview and concurrent clashes,
  single add, type editing/clearing, rename and deletion with restored focus.
  Temporary Vite/Playwright configuration files were removed after the run.
- `git diff --check` passed. No staging, commits, dependency installation or push.

The first HTTP run was red before route implementation. Component tests caught
Dialog focus restoration overriding the immediate post-delete focus target;
requesting focus after the closing render fixed the behavior. Initial browser
runs caught two test-selector mistakes, corrected before the passing run.

Main-agent integration, combined checks across the full repository, and actual
database concurrency/atomicity checks remain the completion gate. Database
transaction mocks at the HTTP seam do not establish real database rollback.
