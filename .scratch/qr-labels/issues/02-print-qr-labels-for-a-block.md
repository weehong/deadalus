# 02: Print QR labels for a Block

**What to build:** An Administrator finds a "Print QR labels" secondary button on each Block in the Structure tab's Blocks pane. It opens `/projects/$id/qr-labels?block=<blockId>`, a Console route under the `_console` guard but outside the Project tab layout (route file `projects_.$id.qr-labels.tsx`), so the page carries no tabs, header or sidebar. The page reads the full Project with the existing query hook and shows a back link to the Structure tab, a heading with the Project code and name and the Block name, the label count, a Print button calling `window.print()`, and the Block's labels laid out as A4 sheets. Back link, heading and button are hidden in print. A Block with no Units shows a message instead of a sheet; an unknown Block or Project shows the existing not-found treatment.

Layout is the 21-up A4 layout of Avery L7160 stock: three columns by seven rows of 63.5 mm by 38.1 mm labels, 15.15 mm top and bottom page margins, 7.2 mm side margins, 2.54 mm column gap, no row gap, `@page { size: A4; margin: 0 }`. Labels run in Storey order (position, lowest first) then Unit order (position), filling rows left to right. On screen the sheets render at the same physical size with a light border. Each label shows a QR code on the left (about 30 mm, error correction M) encoding the Field Unit URL, and to the right the full Unit label in large bold type with the Project code and Block name in small type beneath. Text is clipped, never wrapped. The QR has an accessible name that is the full label, and the encoded URL is exposed on the element (a data attribute) for tests.

Two pure helpers with unit tests: `fieldUnitUrl(origin, unitId)` in the field feature giving `${origin}/field/units/${unitId}`, and `unitLabel(storeyName, unitName)` in the projects feature giving `#${storeyName}-${unitName}`. The origin is `window.location.origin` at render time. The QR encoder is `qrcode-generator` (MIT, no runtime dependencies), pinned in the frontend, rendered as an inline SVG string; `qrcode` is the fallback if it proves unfit; `pnpm audit` must show no advisory that `.scratch/dependency-audit/follow-up.md` does not already list. Components `QrLabel` and `QrLabelSheet` each get a story and a test; `ProjectQrLabelsPage` composes them. The placeholder "QR sheets" button in the PageHeader story is renamed to "Print QR labels". Strings in both locales.

Spec: `.scratch/qr-labels/spec.md`. ADR-0010 applies.

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] The Blocks pane shows "Print QR labels" per Block, linking to the print route with `block` set
- [x] The print route renders outside the Console shell and Project tabs, behind the Administrator guard
- [x] Labels appear in Storey then Unit order with the full label, Project code and Block name, and each QR encodes `${origin}/field/units/${unitId}`
- [x] The sheet matches the stated A4 geometry; controls are hidden under print media; a Block with no Units shows its message
- [x] `fieldUnitUrl` and `unitLabel` are unit-tested, including a Storey named G, a three-digit Unit name and a manual name with spaces
- [x] `QrLabel` and `QrLabelSheet` have a story and a test beside them
- [x] The Console e2e spec covers the action, the order, the label text, the encoded URL, the empty case, the absence of chrome and the print-media hiding, with the accessibility check the Project specs use
- [x] `pnpm audit` shows no new advisory; the dependency is pinned
- [x] Typecheck, lint with zero warnings and the projects tests pass

## Comments

### Built — 2026-09-12

Route `routes/projects_.$id.qr-labels.tsx` at `/projects/$id/qr-labels` with an
optional `block`. One deviation from the spec, and it is deliberate: the file
sits at the routes root rather than under `_console`, because `_console`'s
component *is* the Console shell, so a child of it cannot avoid the sidebar.
The Administrator check is unchanged and now shared —
`features/console/guard.ts` `requireAdministratorSession` is called by both
`_console` and this route — so the page is guarded exactly as before while
carrying no chrome. `e2e/project-accessibility.spec.ts` covers the guard for
the new path, and a dedicated e2e test asserts the absence of Console
navigation, Project tabs, sidebar and banner.

Pieces: `field/field-unit-url.ts` (`fieldUnitUrl`), `projects/unit-label.ts`
(`unitLabel`), `projects/qr-labels.ts` (`qrLabelBlocks`, which orders Blocks,
Storeys and Units by position and filters to one Block, and takes a structural
`LabelledProject` so a fixture needs only names, ids and positions),
`projects/qr-code.ts` (`qrCodePath`: level M, dark modules as one SVG path with
horizontal runs merged, so 21 codes are 21 elements), `QrLabel`,
`QrLabelSheet` (with `QrSheetStyles`) and `ProjectQrLabelsPage`.

The sheet stylesheet is rendered by the page as a plain `<style>` rather than
hoisted, because `@page { size: A4; margin: 0 }` cannot be scoped to an
element and must not outlive the route and impose A4 on other Console screens'
print. The page is its own `<main>`, so the header above the sheets does not
read as a banner landmark.

Two copy decisions beyond the spec: the per-Block link's accessible name is
"Print QR labels for Block A" (visible text unchanged, so Label in Name
holds), which also distinguishes it from the Project-wide action; and a stale
`block` or missing Project shows this page's own not-found pair rather than the
Project screen's "Project not found", which would be untrue of a Block.

Verification: `fieldUnitUrl` 2 cases, `unitLabel` 4 (including a Storey named
G, a three-digit Unit and manual names with spaces), `qrLabelBlocks` 4,
`qrCodePath` 4, `QrLabel` 2, `QrLabelSheet` 2; stories for both components.
`e2e/project-qr-labels.spec.ts` 10 tests. `pnpm audit` reports the same 15
advisories (8 moderate, 5 high, 2 critical) in the same packages as
`.scratch/dependency-audit/follow-up.md` records; `qrcode-generator` is pinned
at 2.0.4 and adds none.