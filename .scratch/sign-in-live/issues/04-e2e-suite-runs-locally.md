# 04: The end-to-end suite runs on this development machine

**What to build:** `playwright test` — and any browser-level sign-in check — can actually
launch a browser here.

Today the installed Chromium build fails to start because a system shared library it needs is
absent, so the intercepted end-to-end suite and a real browser drive of the sign-in screen
cannot run locally. Installing the browser's system dependencies needs root, so this is
owner work. Once done, the suite in the repository runs unchanged and the browser-level half
of ticket 03's verification (guard redirect, generic alert on a wrong password, landing on
the console root, Session surviving a reload, sign-in route bouncing a signed-in
Administrator) can be exercised.

**Blocked by:** None (can start immediately)

**Status:** needs-human

- [ ] The Playwright browser dependencies are installed on this machine.
- [ ] The existing end-to-end suite passes locally without modification.
- [ ] A browser-level sign-in against the live provider has been driven once, with the
      password read from the credential store, and the five behaviours above observed.
