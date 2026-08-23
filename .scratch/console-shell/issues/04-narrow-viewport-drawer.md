# 04: Narrow-viewport drawer with top bar and menu button

**What to build:** Below the medium breakpoint an Administrator sees a slim top bar carrying the Daedalus Ops mark and a menu button instead of the fixed sidebar. Pressing the button opens the same sidebar as a drawer: focus is trapped inside, the page behind stops scrolling, and the drawer closes on Escape, on tapping the backdrop, or on choosing any destination — after which focus returns to the menu button. The button announces its open/closed state. At and above the breakpoint nothing changes.

The drawer uses the installed headless dialog component for focus trap, Escape, backdrop and scroll lock; that package is promoted to a runtime dependency.

**Blocked by:** 02 (Sidebar with navigation items mounted in the console layout)

**Status:** ready-for-agent

- [ ] Below the medium breakpoint the layout renders the top bar (Logo + menu button) and hides the fixed sidebar
- [ ] Menu button opens a dialog containing the sidebar; `aria-expanded` reflects state
- [ ] Drawer closes on Escape, backdrop click, and any navigation click; focus returns to the button
- [ ] Body scroll is locked while the drawer is open
- [ ] Story shows the drawer at a narrow viewport
- [ ] Unit tests cover open, each close path, focus return and `aria-expanded`, rendered inside the real router with in-memory history
- [ ] Headless dialog package promoted to a runtime dependency; lint, typecheck, unit and e2e suites green
