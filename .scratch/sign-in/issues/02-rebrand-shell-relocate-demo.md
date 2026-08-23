# 02: Rebrand the shell and relocate the demo

**What to build:** An Administrator with many tabs open can find the console by its title, and
the application identifies itself as Daedalus Ops rather than as a boilerplate template.

At the same time, the boilerplate demo feature moves off the application root onto its own
route. The root is needed for the guarded console landing, and the demo is deliberately kept
rather than deleted: it remains the live reference for the project's form, query, table and
end-to-end conventions. Deleting it is a separate, later decision.

The existing end-to-end suite asserts both the old title and the demo's location, so it is
updated in step and must stay green. The project readme is a genuine rewrite and is explicitly
not touched here.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The browser tab reads Daedalus Ops.
- [ ] The document's declared language attribute is present and correct.
- [ ] The package identifies itself as Daedalus Ops with an accurate description.
- [ ] The boilerplate demo is reachable at its own route and renders as before.
- [ ] The application root no longer renders the demo.
- [ ] The existing end-to-end suite passes against the new title and the new demo location.
- [ ] The project readme is unchanged.
- [ ] Lint, type-check and unit tests pass.
