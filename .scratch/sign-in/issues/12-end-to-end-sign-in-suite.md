# 12: End-to-end sign-in suite

**What to build:** Proof that the whole path works together — the form, the provider call, the
error mapping, the session store, the guard and the redirect — exercised through a browser the
way an Administrator would.

These tests run against the project's **single seam: the authentication provider's HTTP
boundary**, intercepted by the end-to-end runner's request routing. That is the outermost real
dependency, so everything inside it is the real thing: the real client, the real store, the
real guard, the real form. There is no module mocking anywhere and no test-only injection point
in application code.

The seam choice has an accepted cost, recorded here so it is not rediscovered as a surprise:
the page wiring, the guard and the redirect round-trip are covered **only** at this level, so
feedback on them is slower than a unit test. That was chosen over adding a request-mocking
library to the unit suite, in order to keep the seam count at one.

A good test here states what an Administrator could observe — what is rendered, what is
announced, where a navigation lands — and finds elements by role, label and text, never by
class name or test id.

**Blocked by:** 10, 11

**Status:** ready-for-agent

- [ ] An unauthenticated visitor to a guarded route is redirected to sign-in with the intended
      destination preserved.
- [ ] A successful sign-in lands on that preserved destination.
- [ ] A successful sign-in from a direct visit lands on the console root.
- [ ] A rejected sign-in shows the generic message and stays on the sign-in screen.
- [ ] A rate-limited response shows the rate-limit message.
- [ ] An already-authenticated visitor to the sign-in route is redirected away.
- [ ] The relocated demo route and its existing assertions still pass.
- [ ] All interception happens at the provider's HTTP boundary; no module is mocked and no
      test-only hook exists in application code.
- [ ] Elements are located by role, label or text rather than by class name or test id.
- [ ] Lint, type-check, the unit suite and the full end-to-end suite all pass.
