# 05: Input, field and alert primitives

**What to build:** The three form primitives the console's inputs are built from, each standing
alone and inspectable without running the application.

The **input** is the system's text control, and must forward its ref so that the project's form
library can register it.

The **field** pairs a label, a control and an error message, and exists specifically to
guarantee the wiring an Administrator using a screen reader depends on: the label is
programmatically associated with its control, the control is marked invalid when it is, and the
error message is announced as that control's description. Getting this wrong is invisible to a
sighted developer, which is exactly why it belongs in a primitive rather than being re-done per
form.

The **alert** renders a message as an assertive live region, so a failure is announced to a
screen-reader user without stealing their focus.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] The input renders with the design system's treatment and forwards its ref.
- [ ] A field's label is programmatically associated with its control, so activating the label
      focuses the control.
- [ ] A field in an error state marks its control invalid and exposes the message as that
      control's description.
- [ ] A field with no error exposes no error text and does not mark its control invalid.
- [ ] The alert exposes an alert role and announces assertively without moving focus.
- [ ] Every interactive element shows a visible keyboard focus indicator.
- [ ] Each primitive has a story showing its states, and tests covering rendered output, roles
      and accessible wiring rather than internals.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
