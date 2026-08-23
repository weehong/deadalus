# 08: Sign-in screen at its route

**What to build:** The complete sign-in screen, reachable in a browser and demoable end to end
as a piece of interaction design — before any authentication provider exists.

An Administrator navigating to the sign-in route sees the finished composition: the brand panel
beside the framed sign-in card, the card carrying its kicker, heading and subtitle, the two
fields, the full-width framed submit button, and a closing line telling a visitor without an
account to ask their site administrator for access. The prototype's note about any credentials
working is gone.

The screen is fully keyboard-operable, the email field comes first in tab order, and the whole
thing stacks and remains usable on a narrow viewport.

Submission is wired to a **temporary stub that resolves successfully**. This is deliberate: it
makes the visual and interaction work demoable and reviewable without a Supabase project
existing, and the stub is replaced in the next ticket. The sign-in page is the only module that
will ever know about the authentication provider, so the stub lives there and nowhere else.

Deliberately not built: remember-me, a sign-up link, and a forgot-password link. The provider
persists sessions already; Administrators are provisioned rather than self-serve; and the
password-reset flow is out of scope, so a link to nothing would be a broken promise.

**Blocked by:** 02, 06, 07

**Status:** ready-for-agent

- [ ] The sign-in route renders the full screen: brand panel, framed card, both fields, submit
      control and the access-request line.
- [ ] The screen is reachable in a running browser at its route.
- [ ] The email field is first in tab order and every control is reachable and operable by
      keyboard.
- [ ] On a narrow viewport the screen stacks into one column and remains fully usable.
- [ ] Submitting valid input calls the page's handler and shows the pending state.
- [ ] There is no remember-me control, no sign-up link and no forgot-password link.
- [ ] No copy suggests this is a prototype or that any credentials will work.
- [ ] All visible text resolves through the translation layer.
- [ ] The temporary stub is confined to the page module and clearly marked as temporary.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
