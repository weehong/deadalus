# 10: Guard routes and preserve the intended destination

**What to build:** The console stops being open to anyone, and signing in stops costing an
Administrator their place.

An Administrator who is not signed in and tries to reach a guarded route is sent to the sign-in
screen with their intended destination carried along, and is returned there once they succeed.
One who is already signed in and navigates to the sign-in screen is moved straight on, so they
are never asked to authenticate twice.

Guarding happens in the router's pre-load hook, reading the session from the store through
router context, so the decision is synchronous and a guarded component never mounts for an
unauthenticated visitor.

Because the provider resolves the stored session asynchronously on startup, the application
root holds an explicit **restoring** state until the first auth-state event arrives. Without
it, every page reload briefly shows the sign-in screen to an Administrator who is already
signed in — which reads as being logged out, and is the single most likely thing to be
mistaken for a bug.

The relocated boilerplate demo stays reachable without signing in, so its end-to-end tests keep
passing.

**Blocked by:** 09

**Status:** ready-for-agent

- [ ] An unauthenticated visitor to the console root is redirected to the sign-in screen.
- [ ] The intended destination is carried in the redirect and survives the round trip.
- [ ] A successful sign-in lands on the preserved destination.
- [ ] A successful sign-in from a direct visit to the sign-in screen lands on the console root.
- [ ] An authenticated visitor to the sign-in route is redirected to the console root.
- [ ] Reloading while signed in does not flash the sign-in screen.
- [ ] A guarded route's component never mounts for an unauthenticated visitor.
- [ ] A session survives a page reload and a new tab.
- [ ] The relocated demo remains reachable without signing in and its tests still pass.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
