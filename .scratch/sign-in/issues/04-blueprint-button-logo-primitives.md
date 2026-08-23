# 04: Blueprint frame, button and logo primitives

**What to build:** The three visual primitives that carry the Daedalus Ops identity, each
standing alone and inspectable without running the application.

The **blueprint frame** is the wireframe object the whole system is built from: a square,
hairline-bordered box with four crosshair registration marks at its corners. Every card, figure
and primary action in the console wears it, so it must accept the element type it renders as
rather than being locked to one.

The **button** covers the system's action variants — the solid accent primary, the outlined
secondary, the ghost and the icon — plus full-width, framed and pending forms. A pending button
communicates that it is working and refuses further presses.

The **logo** pairs the square registration mark with the Daedalus Ops wordmark at two sizes,
inheriting its colour so it reads correctly on both the light ground and the reversed accent
field.

These are shared primitives, not sign-in components: the dashboard reuses the same framed object
on every card and KPI cell.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The blueprint frame renders its border and all four corner marks, and can render as a
      different element without losing them.
- [ ] The button renders every variant with the correct design-system treatment.
- [ ] A full-width button fills its container; a framed button carries the corner marks.
- [ ] A pending button indicates progress, is disabled, and cannot be activated.
- [ ] A disabled button is not activatable by mouse or keyboard.
- [ ] Every interactive element shows a visible keyboard focus indicator.
- [ ] The logo renders at both sizes and takes its colour from its context.
- [ ] Each primitive has a story showing its variants and states, and tests covering rendered
      output, variants and roles rather than internals.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
