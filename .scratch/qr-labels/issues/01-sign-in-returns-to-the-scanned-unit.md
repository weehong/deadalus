# 01: Sign in returns to the scanned Unit

**What to build:** A Member who opens a Field URL without a Session (a scanned QR label, first use, an expired or lapsed Session) is sent to Sign in and, after signing in, lands on the URL they asked for instead of the Projects list. The `_field` guard redirects to `/field/login` with a `redirect` search param carrying the requested pathname and search. The sign-in route validates `redirect` as an optional string kept only when it starts with `/field/` and is not `/field/login`; anything else (a full URL, `//host`, a Console path, empty) is dropped. The sign-in page navigates to `redirect` or `/field`; the route's "already signed in" guard honours it the same way. The validator is a pure function with a unit test.

The Field Unit screen's not-found message becomes "No Items for {{subcontractor}} in this Unit. The QR label may belong to another company, or be out of date." with the Subcontractor name from the Session, in both locales (zh-CN machine-translated and flagged). The API is unchanged.

Spec: `.scratch/qr-labels/spec.md`. ADR-0010 applies.

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] Signed out, visiting `/field/units/<id>` lands on `/field/login?redirect=/field/units/<id>` and, after a successful sign in, on that Unit with its Items
- [x] A `redirect` of `https://evil.example`, `//evil.example`, `/projects/1`, `/field/login` or `` is ignored and sign in lands on `/field`
- [x] A signed-in Member visiting `/field/login?redirect=/field/units/<id>` is sent to that Unit
- [x] A 401 mid-Session on a Unit URL ends the Session, shows Sign in with the session-ended notice, and returns to the Unit after sign in
- [x] The not-found state names the Member's Subcontractor and keeps "Back to Projects", for a Unit of another company and for an unknown id, in both locales
- [x] The validator is unit-tested with the cases above; the Field e2e spec covers the return-to, the rejected values and the not-found copy at phone width
- [x] Typecheck, lint with zero warnings and the Field tests pass

## Comments

### Built — 2026-09-12

The return-to is one pure function and two call sites.
`features/field/return-to.ts` holds `fieldReturnTo(value)`, which keeps a
value only when it is a string starting `/field/` whose path is not
`/field/login`, and `fieldReturnToHere(location)`, which applies it to a
location's pathname plus search. `routes/_field.ts` redirects a visitor to
`/field/login` with that value as `redirect`; `routes/field.login.tsx` (renamed
from `.ts` for its route component) validates `redirect` with
`z.string().optional().transform(fieldReturnTo)`, sends an already-signed-in
Member straight there with `redirect({ href })`, and passes it to
`FieldSignInPage` as `returnTo`, which navigates to it after a successful sign
in or to `/field` without one. A visit to `/field` itself yields no param, so
the existing Sign in URLs are unchanged.

`FieldLayout` needed more care than the spec anticipated. It watches the
Session end mid-visit, and when it did so from the live location it navigated
twice: once with the Unit, then again with the location already on its way to
Sign in, which wiped the param. It now remembers the last Field screen while
the Session is alive in a ref and navigates once, on the Session ending alone.
That is what makes the 401 case land back on the scanned Unit.

`FieldUnitPage` reads the Subcontractor name from the Session for the reworded
not-found message, in both locales. The API is untouched.

Verification: `return-to.test.ts` 10 cases (the accepted path with its search,
a full URL, a protocol-relative host, a host behind the Field prefix, a Console
path, Sign in with and without a search, `/field`, an empty string, a
non-string). `e2e/field-scan.spec.ts` (12 tests, 390px) covers the signed-out
scan, a deep link keeping its search, the signed-in Member sent straight on,
the five rejected values, the expired Session returning to the Unit, both
not-found cases with the Subcontractor named and the way back, and the
Chinese reading. `e2e/field-unit.spec.ts` copy assertions updated. Typecheck
and lint clean; frontend unit suite 80 files, 277 tests.