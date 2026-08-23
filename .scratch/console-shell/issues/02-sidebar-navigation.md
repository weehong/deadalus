# 02: Sidebar with navigation items mounted in the console layout

**What to build:** On a desktop-width viewport, every console screen shows the dark 236px sidebar fixed to the left: the Daedalus Ops mark and name with the scope label "All sites" beneath, then the six destinations each with an icon, label and — for Work orders and System status — a placeholder count. The destination the Administrator is on is visibly marked and announced as current; Overview matches exactly, every other item matches by prefix so a nested page keeps its section lit. Clicking an item navigates there. A visually hidden "Skip to content" link precedes the sidebar and jumps focus to the main region.

`Sidebar` is presentational — items, scope and (later) status arrive as data — and `SidebarItem` is a router link whose accessible name includes its count ("Work orders, 148"); counts render as tabular numerals, dimmed on non-current items, capped at "999+", and absent when no count is given. Navigation items are defined once in a console feature module. Icons come from the installed outline set at 16px; that package is promoted to a runtime dependency. Colours map to the steel-900 ground with canvas text and white-alpha hairlines, matching the sign-in brand panel. Below the medium breakpoint the sidebar is simply hidden for now (the drawer is ticket 04).

**Blocked by:** 01 (Console layout route with session guard and stub destinations)

**Status:** ready-for-agent

- [ ] `Sidebar` and `SidebarItem` live in the layout tier, each with story and tests, exported from a barrel
- [ ] The sidebar renders a navigation landmark listing the six destinations in order with icon and label; Logo and scope label sit above
- [ ] The current item carries `aria-current="page"` and the border-plus-wash treatment; Overview is exact-match, others prefix-match
- [ ] Counts: tabular numerals, dimmed when not current, "999+" above 999, omitted when none, included in the link's accessible name
- [ ] Navigation configuration module defines the six items (label key, path, icon, exact flag, placeholder count) and is the sidebar's only source of items
- [ ] Skip link is the first focusable element and targets the main content region
- [ ] Unit tests mount the sidebar inside the real router with in-memory history; no module mocking
- [ ] End-to-end: from Overview, clicking each sidebar item lands on its path, shows its heading, and marks it current
- [ ] Icon package promoted to a runtime dependency; lint, typecheck, unit and e2e suites green
