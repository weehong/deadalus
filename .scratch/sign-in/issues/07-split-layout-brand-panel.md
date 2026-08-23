# 07: Split layout, figure grid and brand panel

**What to build:** The identity half of the sign-in screen, and the composition that holds it.

The **split layout** implements the design's asymmetric two-column arrangement on a desktop and
stacks into a single readable column below the medium breakpoint, so an Administrator can sign
in from a phone. It is generic: it takes an aside and its children and knows nothing about
authentication, because the same composition will serve other pre-authentication screens.

The **figure grid** renders the hairline-separated row of headline figures — a value over its
label — as a reusable primitive, since the dashboard's KPI cells use the same treatment.

The **brand panel** composes the logo, a kicker, a condensed headline, a short blurb and the
figure grid on a solid deep-accent field with reversed type. It tells an Administrator which
system they are signing in to, and tells a new colleague what the console covers.

All of the panel's copy and figures are **props**, supplied from a separate content module
holding the Daedalus Ops values. The layout is reusable; the identity is data.

**Blocked by:** 01, 04

**Status:** ready-for-agent

- [ ] On a desktop viewport the layout renders two columns in the design's asymmetric ratio.
- [ ] Below the medium breakpoint the layout stacks into one column and the page scrolls
      normally rather than clipping.
- [ ] The figure grid renders however many figures it is given, each as a value over its label,
      with the hairline separation.
- [ ] The brand panel renders the logo, kicker, headline, blurb and figures it is given.
- [ ] The brand panel contains no hard-coded product copy; the Daedalus Ops values come from a
      content module.
- [ ] Reversed type on the accent field is legible and takes its colours from design-system
      tokens.
- [ ] Each component has a story, and tests covering rendered content and responsive behaviour
      rather than internals.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
