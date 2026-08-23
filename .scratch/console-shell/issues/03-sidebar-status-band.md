# 03: Sidebar status band — last sync and service impairment

**What to build:** At the foot of the sidebar the Administrator sees "Last sync" with a clock time, and — only when any services are impaired — a coloured marker with "N services impaired", correctly pluralised in each language. In the running application the sync time is the moment the shell mounted (formatted HH:mm with the project's date library) and no impairment count is passed, so the impairment row is absent; the Storybook story shows the impaired variant. No fictional values from the prototype reach the screen.

**Blocked by:** 02 (Sidebar with navigation items mounted in the console layout)

**Status:** ready-for-agent

- [ ] `SidebarStatus` component with story (default and impaired) and tests, exported from the sidebar barrel
- [ ] `Sidebar` accepts a status prop and renders the band at its foot
- [ ] "Last sync" row shows the supplied time; the layout supplies the mount time formatted HH:mm
- [ ] Impairment row renders only when a count is supplied, with plural forms in en-US and zh-CN
- [ ] Unit tests: time renders; impairment line absent without a count, present and pluralised with one
- [ ] Lint, typecheck and unit suites green
