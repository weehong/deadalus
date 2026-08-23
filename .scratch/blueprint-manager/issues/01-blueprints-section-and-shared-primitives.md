# 01: Blueprints section in the sidebar, its routes, and the shared primitives

**What to build:** An Administrator sees "Blueprints" in the sidebar with a building icon; clicking it lands on the Building structure screen, and while inside Blueprints four indented sub-entries appear — Upload drawings, Building structure, Units, Subcontractors — with the current one marked. Each sub-route exists and renders a titled page carrying the new page heading (title, Site-name context line, actions slot) — the Site name is a placeholder string until ticket 02 resolves a real Site. The bare Blueprints path redirects to structure. Stub pages for the four screens are empty beyond their heading.

This is the prefactor: the sidebar gains a collapsible section primitive and the navigation configuration gains children; the shared primitives the four screens will all use — tag (three tones), plain table styled on the design system's table class, page heading, confirm dialog (names the item; disabled with an inline reason when blocked) — are built with stories and tests here so later tickets only compose them. Nav and stub headings in both locales; glossary already updated.

**Blocked by:** None (can start immediately)

**Status:** complete (Playwright coverage written; host browsers unavailable)

- [ ] Sidebar shows a "Blueprints" section (distinct building icon) whose parent row links to the structure route and whose four children render only while the current path is inside Blueprints, current child marked with `aria-current`
- [ ] Blueprints layout route with child routes for structure, units, a unit by id, subcontractors and upload; the bare path redirects to structure
- [ ] Page heading primitive (title, context line, actions slot) used by every Blueprint stub page
- [ ] Tag, table, confirm dialog and sidebar section primitives each have a story and tests
- [ ] Navigation configuration defines the section and its children in one place; the console's existing six destinations are unchanged
- [ ] Unit tests on the real in-memory router: section expands/collapses by path, children marked current, confirm dialog blocked state
- [ ] End-to-end (written; host cannot run Playwright): sidebar section appears, each sub-route loads with its heading
- [ ] Lint, typecheck, unit tests and build green
