# ADR-0007: The spreadsheet reader is SheetJS installed from the SheetJS CDN, not from npm

## Status

Accepted, 2026-09-11.

## Decision

The backend reads uploaded Unit Matrix workbooks with SheetJS Community
Edition, declared in `apps/backend/package.json` as a pinned tarball from
`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`. The package is not
installed from the npm registry. Upgrades change the pinned URL.

## Alternatives considered

- **`xlsx` from the npm registry.** Rejected: the registry build has been
  frozen at 0.18.5 since 2022 and carries open advisories (prototype
  pollution, regular-expression denial of service) that `pnpm audit` would
  flag on every install. SheetJS publishes its fixed releases only on its own
  CDN.
- **exceljs, accepting `.xlsx` only.** Rejected: the real Tampines schedule
  is a legacy `.xls` (BIFF8) workbook, and exceljs does not read that
  format. Asking an Administrator to re-save every legacy file before
  uploading moves a tooling problem onto the person least able to see it.
- **Parsing in the browser.** Rejected in favour of the server owning
  validation: one parser, one set of tests, and a contract the preview
  screen consumes as plain JSON.

## Consequences

- `package.json` carries a dependency URL that is not on npm. Anyone reading
  it should find this ADR; the comment beside the dependency points here.
- The tarball is fetched at install time from a third-party host. The
  lockfile records its integrity hash, so a changed tarball fails the
  install rather than running silently.
- Renovate or Dependabot will not propose upgrades; someone checks the CDN
  when a SheetJS fix matters.
- The reader is a server dependency only. The browser never parses a
  workbook.
