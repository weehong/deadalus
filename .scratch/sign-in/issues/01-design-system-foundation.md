# 01: Design-system foundation

**What to build:** Any component rendered in Storybook or in the application picks up the
Industry design system — its tonal ramps, its condensed-heading-over-body type pairing, and
its single light ground. Today the application renders in stock Tailwind defaults, so nothing
built on top of it can look right until this lands.

The system's stylesheet is vendored verbatim and treated as the source of truth for tokens and
primitive classes. Its ramps are mirrored into the Tailwind theme layer so utilities resolve to
the same values; the ramp steps keep their names, while the four role tokens are renamed in the
Tailwind layer only, for readable utility names — the ground becomes `canvas`, the text colour
becomes `ink`, the divider becomes `rule`, and the surface keeps its name. The mapping is
commented where it is defined. Spacing and radius are not mirrored; layout uses Tailwind's own
scale.

Two deviations from the vendored file are required and must be recorded in a header comment so
a future re-vendor knows what to re-apply: the remote web-font import is replaced by
self-hosted font packages, and system CJK families are appended to the heading and body stacks
because the system's faces carry no Chinese glyphs.

The design system defines no dark ramp, so the console is light-only.

This ticket also carries ADR-0001, recording why the stylesheet was vendored rather than ported
wholesale to utility classes.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The design system's stylesheet is vendored into the project and loaded by both the
      application and Storybook.
- [ ] A component using a ramp utility renders in the correct design-system colour.
- [ ] A component using the renamed role utilities renders on the correct ground with the
      correct text and divider colours.
- [ ] Headings render in the condensed face and body text in the body face, with no network
      request to a third-party font host.
- [ ] Chinese characters render in a system CJK face rather than falling through to a default
      serif.
- [ ] The inert Tailwind v3-style JavaScript config file is deleted and the build still
      succeeds.
- [ ] Storybook no longer offers a light/dark theme switch.
- [ ] ADR-0001 exists, states the alternative that was rejected, and gives the reasons.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
