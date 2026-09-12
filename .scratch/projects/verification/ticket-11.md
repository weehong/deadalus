# Ticket 11 verification

Implemented the guarded Structure commit route, shared Serializable retry extension, batched atomic writes, matrix conversion, editable/included Block headers, commit/cache/navigation summary, disabled upload action, both locales and independent browser fake.

- Backend HTTP seam: 20 tests pass in `tests/integration/structure.route.test.ts`. Covers authentication before expanded JSON parsing, unknown/nonempty Projects, malformed/oversized JSON, caps and duplicate sibling details, existing code reuse, positions and transaction call shape, P2034 and P2002 races, OpenAPI and a successful 10,000-Unit payload written in ten bounded Unit batches.
- Existing Block HTTP suite: 16 tests pass with the extended retry helper. Default retries still handle only P2034; commit opts into P2002 retries to re-read a concurrent winner.
- Frontend: matrix conversion and existing accordion tests pass (3 tests). Conversion covers filled cells, nulls/merged followers, Stack padding, empty Storey omission and normalized header errors.
- Both app lint and TypeScript checks pass.
- Chromium: 6 scenarios pass across `e2e/structure-commit.spec.ts` and existing `e2e/unit-matrix-upload.spec.ts`. Covers rename/untick/duplicate/blank validation, successful counts/selection, busy and 409, disabled action, existing upload behavior and phone width. The isolated worktree cannot serve shared font assets because of Vite fs.allow; main must confirm integrated browsers with normal fonts. Temporary browser config removed.

The complete payload uses an 8 MB bound after authentication, while other JSON routes retain their existing 100 KB default. Transactions allow 60 seconds and use batches of 1,000 to avoid database parameter/round-trip limits. Database concurrency and combined integration checks remain the main agent's responsibility.

## Review follow-up

Import summary counts are snapshots carried in validated route search, so later manual edits do not rewrite the reported import result. Selection normalization preserves every snapshot field. Frontend lint and TypeScript checks pass again; all three commit Chromium scenarios pass, including a new regression that adds a manual Block and deletes the imported Block, forcing fallback selection while the original Block/Storey/Unit/Unit Type counts remain unchanged. No backend behavior changed, so earlier backend evidence is reused.
