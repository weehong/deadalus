# 06: Sign-in form

**What to build:** A complete, working sign-in form that can be exercised in isolation — filled
in, validated, submitted, shown as pending, and shown failing — without any authentication
provider existing.

An Administrator enters a work email and a password. Obvious problems are caught before the
network is touched: a malformed address and an empty field are both reported inline, against
the field they belong to. The password can be revealed to check for a typo, and the reveal
control announces its own state so a screen-reader user knows whether the password is currently
visible; the revealed state does not persist between visits, so a password is never left
showing on a shared machine.

Validation is deliberately **shape-only**. The email must be a well-formed address and the
password must be non-empty — nothing more. Applying a length or complexity rule at sign-in
would disclose the password policy and would lock out anyone whose password predates a policy
change; policy belongs at password-set time.

While a submission is in flight the submit control indicates progress and refuses a second
press, so a slow connection cannot produce a double submission. A failure supplied to the form
is rendered in the alert primitive above the fields, announced without moving focus, and
cleared when the Administrator corrects their input and tries again.

The form takes its submit handler, its error and its pending flag from its caller and **imports
nothing from any authentication provider**. This is what makes it fully testable and
story-able, and it is a deliberate structural decision, not an accident.

All visible text comes from the translation layer.

**Blocked by:** 03, 04, 05

**Status:** ready-for-agent

- [ ] Submitting an empty form reports both fields as required and does not call the submit
      handler.
- [ ] A malformed email is reported before the submit handler is called.
- [ ] No password length or complexity rule is enforced.
- [ ] A valid submission calls the handler once with the entered values.
- [ ] Pressing Enter in a field submits the form.
- [ ] While pending, the submit control indicates progress and cannot be activated again.
- [ ] A supplied error renders in the alert and is announced without moving focus.
- [ ] Correcting input and resubmitting clears the previous error.
- [ ] The reveal control toggles the password between hidden and visible and announces which
      state it is in.
- [ ] The email and password fields expose autofill hints a password manager can use.
- [ ] All visible text resolves through the translation layer, with no hard-coded strings.
- [ ] The form has stories covering its empty, invalid, pending and failed states, and tests
      covering the behaviours above by role and label rather than by internals.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
