# Spec: QR labels

Status: ready-for-agent
Created: 2026-09-12

Synthesised from the grilling interview of 2026-09-12. Vocabulary follows
`CONTEXT.md` (Administrator, Member, Subcontractor, Console, Field, Project,
Block, Storey, Unit, Stack, Item, Assignment, Session, QR label). ADR-0003
(Members scoped to their Subcontractor), ADR-0009 (Member Sessions issued by
the API) and ADR-0010 (a QR label carries the Unit's Field URL by id) apply
throughout. The glossary entry for QR label and ADR-0010 were written during
the interview and are canonical.

## Problem Statement

A Member on site stands at a Unit's door and has to find that Unit in the
Field by hand: Projects, then the Block, then the Storey, then the Unit. On
a phone, in a stairwell, that is four screens and a chance to pick the wrong
one before any progress is entered. The glossary has promised since the start
that a Unit is "the thing a QR label identifies", the Console's sign-in copy
tells Subcontractors to use the QR code on the Unit, and nothing produces or
reads one.

## Solution

Every Unit gets a QR label: a printed sticker carrying a QR code whose
content is the absolute URL of that Unit's existing Field screen. A Member
scans it with the phone's camera. With a Session they land on the Unit and
see the Items assigned to their Subcontractor there; without one they sign
in and are then returned to that Unit; where their Subcontractor holds
nothing they see the existing not-found screen, worded for a scan.

Administrators print the labels from the Console: a print-ready page, laid
out as an A4 grid of labels, for one Block or for a whole Project, sent to
paper or PDF with the browser's own Print. Each label shows the QR code, the
Unit's full label (#12-01) in large type, and the Project code and Block
name in small type.

## User Stories

### Scanning

1. As a Member with a Session, I want scanning a Unit's QR label with my phone camera to open that Unit in the Field, so that I reach my Items in one step.
2. As a Member without a Session, I want a scan to take me to Sign in and then straight to the scanned Unit, so that one scan is enough on first use or after my Session lapses.
3. As a Member, I want a scan of a Unit where my Subcontractor holds no Item to tell me plainly that there is nothing for my company there, with a way back to my Projects, so that I can tell "not my scope" from a broken phone.
4. As a Member, I want a scan of a label whose Unit no longer exists to end on that same screen, so that a stale sticker is not a dead end.

### Printing

5. As an Administrator, I want a "Print QR labels" action on each Block in the Structure tab, so that one building's labels come out together.
6. As an Administrator, I want a "Print QR labels" action for the whole Project on the Structure tab, so that a new Project is labelled in one print run.
7. As an Administrator, I want the print page laid out as a grid of equal labels on A4, ordered by Storey then Stack with a new page at each Block, so that it prints onto 21-up label sheets or plain paper.
8. As an Administrator, I want each label to show the Unit's full label large, and the Project code and Block name small, so that a label can be checked against a door by eye and a loose sheet identified.
9. As an Administrator, I want the print page to preview on screen with a Print button and a way back, so that I can check it before spending label stock.
10. As an Administrator, I want a Block or Project with no Units to say so on the print page instead of printing a blank sheet, so that the action is never silently useless.

### Integrity

11. As a developer, I want the QR to encode nothing but the Unit's Field URL, built from the id and the browser's own origin, so that ADR-0010 holds and no secret ever sits on a door.
12. As a developer, I want the Field's return-to destination to accept only Field paths, so that a crafted sign-in link cannot send a Member off-site or into the Console.
13. As a developer, I want the QR encoder to be one pinned, dependency-free, MIT-licensed npm package rendering inline SVG, adding nothing to the audit that `.scratch/dependency-audit/follow-up.md` tracks, so that the label page prints crisply at any size without a server change.
14. As a developer, I want the Console's sign-in copy, the README and SPEC.md to say "QR label" as the glossary does, so that nothing false or inconsistent remains.

## Implementation Decisions

### Domain model

No new persisted concept. A QR label is a rendering of a Unit that already
exists; its content is derived from the Unit's id and the origin, never
stored. No migration.

- **Field Unit URL**: `${origin}/field/units/${unitId}`, where `origin` is
  `window.location.origin` at print time. A pure `fieldUnitUrl(origin,
  unitId)` helper in the frontend's field feature, unit-tested.
- **Full Unit label**: `#${storey.name}-${unit.name}`, exactly as the
  glossary composes it for display (#12-01, #G-05, #12-114). A pure
  `unitLabel(storeyName, unitName)` helper in the frontend's projects
  feature, unit-tested. It is display only and never parsed.

### API contract

No new or changed route. The Field's `GET /field/units/:unitId/items` is
the scan target and already returns 404 for a Unit outside the Member's
Subcontractor and for an unknown Unit (ADR-0003). The Console's full
Project read already carries every Block, Storey and Unit with names and
positions, which is all the label page needs.

### Frontend, Field

- **Return-to on Sign in**: the `_field` guard redirects to `/field/login`
  with a `redirect` search param holding the requested path (pathname plus
  search). The sign-in route validates `redirect` as an optional string and
  keeps it only when it starts with `/field/` (a relative Field path; never
  a full URL, never `/field/login` itself); anything else is dropped. After
  a successful sign in the page navigates to `redirect`, falling back to
  `/field`. The sign-in route's "already signed in" guard honours it the
  same way. A 401 mid-Session goes through the same guard, so an expired
  Session on a scan also returns to the Unit.
- **Not-found after a scan**: the Field Unit screen's existing not-found
  state (message plus "Back to Projects") is kept; its message becomes "No
  Items for {{subcontractor}} in this Unit. The QR label may belong to
  another company, or be out of date.", using the Subcontractor name from
  the Session. The API still says nothing about the Unit.

### Frontend, Console

- **Route**: `/projects/$id/qr-labels` with an optional `block` search
  param, under the `_console` guard but outside the Project tab layout
  (file `projects_.$id.qr-labels.tsx`, the trailing underscore breaking the
  nesting), so the printed page carries no tabs, header or sidebar. It
  reads the full Project with the existing query hook.
- **Actions**: a "Print QR labels" secondary button per Block in the Blocks
  pane (linking with `block` set) and one in the Structure tab's page header
  area for the whole Project (no `block`). The placeholder "QR sheets"
  button in the PageHeader story is renamed to match or removed.
- **Screen view**: a plain page with a back link to the Structure tab, a
  heading (Project code and name, and the Block name when one is chosen), a
  count of labels, a Print button calling `window.print()`, and the sheets
  below. Back link, heading and button are hidden in print.
- **Sheet layout**: the 21-up A4 layout of Avery L7160 stock: three
  columns by seven rows of 63.5 mm by 38.1 mm labels, 15.15 mm top and
  bottom page margins, 7.2 mm side margins, 2.54 mm column gap, no row gap,
  `@page { size: A4; margin: 0 }`. Labels in Storey order (position, lowest
  first) then Unit order (position) within the Storey, filling rows left to
  right. Each Block starts on a new page (`break-before: page`); the last
  page of a Block is left short rather than filled with the next Block.
  On screen the sheets render at the same physical size with a light border
  so the preview is faithful.
- **Label**: QR code on the left, about 30 mm square, error correction
  level M, encoding the Field Unit URL. To the right, the full Unit label
  in large bold type (fits "#12-114"), and beneath it the Project code and
  Block name in small type ("EG2 · Block A"). Nothing else. Text is
  clipped, never wrapped, so a long manual name cannot break the grid.
- **QR encoder**: `qrcode-generator` (MIT, no runtime dependencies) pinned
  in the frontend, producing an SVG string rendered inline. If the
  implementing agent finds it unfit, `qrcode` is the fallback; either way
  the audit must show no new advisory.
- **Components**: `QrLabel` (one label, given the URL, full label, Project
  code and Block name) and `QrLabelSheet` (one Block's labels paginated),
  each with a story and a test; `ProjectQrLabelsPage` composes them.
- **Copy**: the Console sign-in subtitle becomes "Administrator accounts
  only. Members use the QR label on the Unit." and the brand blurb says
  "QR labels" instead of "QR codes", in both locales.

## Testing Decisions

A good test drives the system from outside a seam and asserts what an
Administrator, a Member or a client would observe.

### Seam 1: the API over HTTP

No new route. The existing Field route tests already assert the 404 for a
Unit outside the Subcontractor and for an unknown id; the scan path relies
on them and adds nothing at this seam.

### Seam 2: the browser

- Field e2e against the existing Field fake at phone width: a signed-out
  visit to a Unit URL lands on Sign in and, after signing in, on that Unit
  with its Items; a `redirect` outside the Field is ignored and lands on
  Projects; a signed-in visit to a Unit of another company shows the
  not-found message naming the Subcontractor with a working "Back to
  Projects"; an unknown Unit id shows the same; an expired Session on a
  Unit URL signs in and returns to it.
- Console e2e against the existing Project fake: the per-Block action opens
  the print page with that Block's labels in Storey then Unit order; the
  Project action opens every Block; the label text and the QR's encoded
  URL (read from the rendered SVG's data attribute or title) match the
  Unit; the empty case shows its message; the page has no Console chrome;
  the print stylesheet hides the controls (asserted with Playwright's
  `emulateMedia({ media: "print" })`).
- Accessibility checks on the print page's screen view as the existing
  Project specs do; each QR has an accessible name that is the full label.
- Each new presentational component (`QrLabel`, `QrLabelSheet`) has a story
  and a test.

### Pure functions

- `fieldUnitUrl` and `unitLabel` unit-tested, including a Storey named G, a
  three-digit Unit name and a manual name with spaces.
- The `redirect` validator: accepts `/field/units/abc`, rejects
  `https://evil.example`, `//evil.example`, `/projects/1`, `/field/login`
  and an empty string.

### Prior art

- Browser seam: the Field auth and Unit e2e specs and their fake; the
  Project structure specs and fake.
- Pure functions: the name-key helper tests.

## Out of Scope

- A scanner inside the Field. Labels are scanned with the phone's camera or
  any QR app.
- A per-Storey or per-selected-Units print action; a Block or the whole
  Project only.
- A dedicated scan code, token or public identifier on a Unit (ADR-0010).
- Anything for an Administrator who scans a label; they land on the Field's
  Sign in like anyone else.
- The Unit Type code on the label.
- A configured Field origin; the printing browser's origin is used.
- Label stock other than the 21-up A4 layout; PDF generation in the app.
- Changing the Field Unit screen's heading to the full Unit label.

## Further Notes

- The "nothing for you here" outcome decided in the interview turned out to
  exist already as the Field Unit screen's not-found state; this feature
  rewords it and covers the scan path end to end rather than adding a
  screen.
- Labels printed from a development origin point at that origin, by design;
  only labels printed from the deployed Console are usable on site
  (ADR-0010).
- Ticket order: the return-to (01) and the Block label sheet (02) have no
  blockers and can proceed in parallel; the Project-wide sheet (03) waits on
  02; verification and documentation (04) waits on all.
