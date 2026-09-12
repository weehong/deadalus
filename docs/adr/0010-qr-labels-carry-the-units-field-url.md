# ADR-0010: A QR label carries the Unit's Field URL by id, with no token

## Status

Accepted, 2026-09-12.

## Decision

A QR label encodes an absolute URL to the Unit's existing Field screen,
`<origin>/field/units/<unit id>`, where the id is the Unit's database id.
The URL grants nothing by itself: the Field's Member Session guard applies
as it does to any other Field URL, a visitor without a Session is sent to
Sign in and returned to the Unit afterwards, and a Member whose
Subcontractor holds no Item in that Unit sees the same not-found outcome as
for an unknown id (ADR-0003). No column, token or resolver route is added
for labels. The origin is the one the Console is served from at the moment
the labels are printed.

## Alternatives considered

- **A dedicated scan code on each Unit**, a random stable value in its own
  column with a route to resolve it. Rejected: it exists only to keep the
  database id off a sticker and to let a label outlive a re-created Unit.
  The id is an opaque cuid and reveals nothing, and a Unit is re-created
  only by deliberate Structure editing, after which reprinting its Block is
  the expected step. A second identifier to explain and migrate is not
  worth that.
- **A secret token in the URL that also signs the Member in**, so that
  scanning alone opens the Unit. Rejected: anyone who photographs a sticker
  on a door would hold it, and ADR-0003 derives the Subcontractor from the
  Member on every request, which a Unit-bound token cannot supply. Sign in
  stays a separate step.
- **A URL to a new scan-specific screen.** Rejected: the Field Unit screen
  already shows exactly the Items assigned to the Member's Subcontractor
  and takes Progress entries; a second screen for the same Items would
  drift from it.

## Consequences

- Stickers on site are long-lived and the URL scheme behind them is now
  fixed. Renaming the Field Unit route, or moving the Field to another
  origin, invalidates every printed label unless the old path is redirected.
- A Unit that is removed and made again has a new id and needs a new label.
- Labels printed from a development origin point at that origin; only
  labels printed from the deployed Console are usable on site.
- The Field's Sign in must carry a return-to destination, limited to Field
  paths, so a scan by a signed-out Member ends on the Unit and not on the
  Projects list.
