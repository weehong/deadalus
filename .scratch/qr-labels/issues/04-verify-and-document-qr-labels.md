# 04: Verify and document QR labels

**What to build:** The combined verification and the documentation. Run the root lint, typecheck and test suites and the full e2e set across the three browsers, including the Field specs at phone width and the new print page specs. Align the copy: the Console sign-in subtitle becomes "Administrator accounts only. Members use the QR label on the Unit." and the brand blurb says "QR labels", in both locales. Update the README (the routes table gains `/projects/:id/qr-labels`; a "QR labels" section describing scanning, the return-to, the print page and the ADR-0010 caveat that labels fix the URL scheme and origin) and add SPEC.md section 19 describing QR labels as built. Confirm CONTEXT.md's QR label and Unit entries match what shipped. Record the outcome as evidence on this ticket.

Spec: `.scratch/qr-labels/spec.md`. ADR-0010 applies.

**Blocked by:** 01, 03

**Status:** complete

- [x] Root lint, typecheck and unit and integration suites pass
- [x] The full e2e set passes across the three browsers, the Field specs at phone width
- [x] Sign-in subtitle and brand blurb say "QR label(s)" in both locales; no user-facing string says "QR code" for the sticker
- [x] README routes table and "QR labels" section, and SPEC.md section 19, describe the feature as built
- [x] CONTEXT.md needs no change, or the change is made and noted here
- [x] Evidence recorded under Comments

## Comments

### Verified and documented — 2026-09-12

Copy: the Console sign-in subtitle is "Administrator accounts only. Members use
the QR label on the Unit." and the brand blurb says "QR labels", in both
locales, with the `PageHeader` story's placeholder "QR sheets" button renamed
and the `BrandPanel` story's copy matched. No user-facing string says "QR code"
for the label any more. Two copy fixes beyond the ticket, both from the
Standards review: the brand blurb said "read completion back", which CONTEXT.md
tells us to avoid for Progression, and now says "read progression back" (zh
"读取进度"); and the new zh-CN Console keys said 栋 for a Block, which is the
Field's spelling, and now say 楼栋 like the rest of the Console.

Documentation: README gains the `/projects/:id/qr-labels` row and a "QR labels"
section covering scanning, the return-to, the print page and the ADR-0010
caveat that the URL scheme and origin are now fixed; SPEC.md gains section 19.
CONTEXT.md needs no change: its QR label entry ("the printed sticker fixed to a
Unit on site… scanning it shows the Member the Items assigned to their
Subcontractor there, after Sign in if needed") and its Unit entry ("the thing a
QR label identifies") both describe what shipped.

Code review since `cf1ec5d` ran on two axes. Acted on:

- **The codes had no quiet zone** (Spec axis, and the only defect that would
  have reached a door): `qrCodePath` draws the modules alone and the label gave
  them only its 2.5mm padding, leaving about two light modules where a scanner
  needs four. `QR_QUIET_ZONE` is now applied by `QrLabel` through the SVG
  viewBox, so the code's box stays 30mm square and the modules shrink to make
  room; the component test asserts it.
- **Sign out no longer hands on the screen** (Spec axis, scope): carrying the
  return-to through every Session ending meant signing out on a site phone left
  the next Member landing on the last company's Unit. Only an expired Session
  is now owed the screen back, with an e2e test for the difference.
- **Vocabulary** (Standards axis): "sticker" as the term became "label" in the
  new code comments and README prose. ADR-0010's own wording is left as
  written, being the canonical record of the decision.
- **A brittle assertion**: the print page's keyboard test counted Tab presses
  and flaked once; it now uses the same `tabTo` helper the Project
  accessibility spec uses.

Left as is, with reasons: the label count sits inside the print-hidden controls
rather than beside them, because printing it would put a stray line on the
paper before the first sheet; `projects.qrLabels.notFound` replaces the Project
screen's "Project not found" because that sentence is untrue of a missing
Block; `PRINT_ACTION` restates the secondary Button's classes on a Link, which
is what `ProjectsPage` and `DirectoryPage` already do for the primary variant —
a shared `LinkButton` is the right fix and is pre-existing debt, not this
feature's; and `LabelledProject` restates the part of `Project` the print run
reads, which keeps its fixtures honest and cannot drift silently because the
page passes a real `Project` to it.

Verification:

- Root `pnpm typecheck` and `pnpm lint` (`--max-warnings 0`): clean for both
  apps.
- Unit and integration suites: backend 44 files, 561 tests; frontend 80 files,
  277 tests (16 of them new across `return-to`, `field-unit-url`, `unit-label`,
  `qr-labels`, `qr-code`, `QrLabel` and `QrLabelSheet`). All passing.
- Playwright, 171 tests per browser with the normal workspace configuration:
  Chromium 171, Firefox 171, WebKit 171, each run on its own. The two new
  specs were then repeated three times on WebKit and twice on Chromium and
  Firefox: 161 passes, no flakes.
- Combined three-browser runs (510 and 513 tests) each showed one or two
  failures in specs this change does not touch, a different one every time: a
  Playwright fake-clock race in the Directory search debounce test on Firefox
  and the Units pane's focus-restore assertion on WebKit. Both pass in their
  own browser's run; this machine is the constraint, not the change.
- `pnpm storybook:build`: succeeded, with the two new stories.
- `pnpm audit` at the workspace root: 15 advisories, 8 moderate, 5 high, 2
  critical, in the same packages `.scratch/dependency-audit/follow-up.md`
  records. `qrcode-generator@2.0.4` adds none.
- No backend file is in the diff, as the spec requires; no migration.
