# 07: Member sign-in to the Field

**What to build:** A Member opens `/field/login`, enters their phone number and nothing else, and lands on the Field's Projects screen (a placeholder until ticket 08) with a header showing their name, their Subcontractor's name and Sign out. An unregistered number is told "That phone number is not registered". The Session survives a reload, lasts thirty days, and ends on Sign out; a Member who has been removed from the Directory is signed out on their next request. Every Field screen redirects to `/field/login` without a Session. The Console's Session and the Field's are independent.

Underneath: `POST /api/v1/field/sessions { phone }`, phone normalised with the existing phone helper and matched against Members; 200 `{ data: { token, member: { id, name, subcontractor: { id, name } } } }`; 404 `MEMBER_NOT_FOUND`; covered by the existing rate limiter. `GET /api/v1/field/me`. The token is an HS256 JWT signed with a new required `MEMBER_TOKEN_SECRET` (at least 32 characters; the backend's example environment file and README updated), issuer `daedalus`, audience `field`, subject the Member id, thirty-day expiry. A `requireMember` check verifies it, loads the Member with its Subcontractor on every request, and answers 401 for a missing, invalid, expired, wrong-audience or Supabase-signed token or a removed Member; the existing Administrator check is unchanged and never accepts a Member token. A Field router at `/field`, a Field tag and a Member bearer scheme in the OpenAPI document. On the frontend, a Member Session read model mirrored to browser storage with a "restoring" state at boot, a fetch helper attaching the Member bearer, and a guarded Field layout; any 401 clears the Session and redirects.

Spec: `.scratch/items-and-progression/spec.md`. ADR-0001, ADR-0003 and ADR-0009 apply; this is the sanctioned exception ADR-0009 records.

**Blocked by:** None (can start immediately)

**Status:** complete

- [x] The token sign and verify pair is unit-tested, including expiry and audience
- [x] Sign-in returns the token and member shape for a known phone in any accepted format; 404 for an unknown phone; 400 for a blank phone; covered at the HTTP seam
- [x] `requireMember` rejects each token failure listed above and a token for a deleted Member with 401; `/field/me` returns the member shape; a Member token on a Console route and a Supabase token on a Field route are both 401
- [x] Environment validation fails fast without `MEMBER_TOKEN_SECRET`; the backend test setup supplies one
- [x] Both routes appear in the OpenAPI document under the Field tag
- [x] The Field sign-in screen, guarded layout, header and Sign out work at phone width, in both locales, with focus and labels for keyboard and screen-reader use
- [x] The Field e2e fake implements sign-in and me; the e2e spec covers a known phone, an unknown phone, reload persistence, sign out, redirect without a Session and a mid-session 401

## Comments

### 2026-09-12 — implemented (ticket agent)

**Backend** (`apps/backend`)
- `src/config/env.ts`: `MEMBER_TOKEN_SECRET` required, min 32 chars. `vitest.setup.ts` supplies a test value; `.env.example`, `apps/backend/README.md` and the root `README.md` env table document it.
- `src/services/member-auth.service.ts`: `signMemberToken` / `verifyMemberToken` (jose, HS256, iss `daedalus`, aud `field`, sub = Member id, 30-day expiry, algorithm pinned so ES256 Supabase tokens never verify), `loadMember` (Member + Subcontractor on every request), `signInWithPhone` (`normalize-phone`, 404 `MEMBER_NOT_FOUND` for unknown or un-normalisable numbers).
- `src/middlewares/require-member.ts` beside `require-auth.ts`; `request.member` typed in `src/types/express.d.ts`. `requireAuth` untouched.
- `src/schemas/field.schema.ts`, `src/controllers/field.controller.ts`, `src/routes/field.route.ts` mounted at `/api/v1/field` in `src/routes/index.ts` (`POST /field/sessions`, `GET /field/me`; the sign-in route sits under the existing rate limiter).
- `src/openapi/registry.ts`: `memberBearerAuth` security scheme, `FieldMember` / `MemberSession` schemas, both paths under the `Field` tag.
- Tests: `tests/unit/member-auth.service.test.ts` (9: round trip, claims, expiry, audience, issuer, wrong secret, no subject, Supabase-signed, garbage), `tests/unit/env.test.ts` (3: boots with the setup secret; exits 1 naming `MEMBER_TOKEN_SECRET` when missing or short), `tests/integration/field-sessions.route.test.ts` (19: four phone formats, unknown 404, un-normalisable 404, three blank 400s, `/field/me` 200 and 401 for missing/invalid/expired/wrong-audience/Supabase/removed Member, Member token on `/api/v1/me` 401, Administrator token still 200 there, OpenAPI tags + schemes).

**Frontend** (`apps/frontend`)
- `src/features/field/`: `types.ts`; `useMemberSessionStore.ts` (Zustand read model mirrored to `localStorage` key `daedalus.field.session`, `restoring` until `restore()` runs at boot, `start` / `update` / `end(reason)`); `api.ts` (`fieldFetch` attaches the Member bearer; any 401 with a token ends the Session as `expired`); `useMemberQuery.ts` (`GET /field/me` on every Field mount, keyed by token); `signInFailure.ts` (closed failure set); `FieldSignInForm` and `FieldHeader` (each with `.stories.tsx` and `.test.tsx`); `FieldSignInPage`, `FieldLayout` (guarded; navigates to `/field/login` when the Session ends), `FieldProjectsPage` (placeholder "No work assigned yet").
- Routes: `src/routes/field.login.ts`, `src/routes/_field.ts`, `src/routes/_field/field.index.ts` (guards read the Member Session store directly so a Session started a moment ago is seen by the next navigation). `src/routeTree.gen.ts` regenerated by the Vite plugin.
- `src/App.tsx`: restores the Member Session at boot alongside the Administrator one; boot loading state until both are restored; router invalidated when either changes. The Console's auth flow is otherwise untouched.
- Translations: `field.*` keys in `en-US` and `zh-CN` (zh-CN machine-translated).
- Controls are 44px outright (`h-[44px]`; the root font is 15px so rem-based `h-11` measures 41.25px), single column, `type="tel"` / `inputmode="tel"` / `autocomplete="tel"`, validation tied to the control via `aria-describedby`.
- e2e: `e2e/field-api.ts` (browser-edge fake: sign-in with normalisation, `me` resolved from the token, `revoke()` for a removed Member) and `e2e/field-auth.spec.ts` at 390×844 (10 tests: redirect without a Session, known phone + header + tap targets + no sideways scroll + bearer on `me`, unknown phone, blank phone, reload + new tab persistence, Sign out, mid-session 401 with notice, Console/Field Session independence, zh-CN end to end, keyboard Tab order).

**Commands and results**
- `pnpm --filter @daedalus/backend exec vitest run tests/unit/member-auth.service.test.ts tests/unit/env.test.ts tests/integration/field-sessions.route.test.ts` — 31 passed (red first: 20 failed / 2 passed before implementation).
- `pnpm --filter @daedalus/backend exec vitest run` — 36 files, 432 passed. `pnpm --filter @daedalus/backend typecheck` and `lint` — clean.
- `pnpm --filter @daedalus/frontend exec vitest run src/features/field` — 4 files, 22 passed (red first). `pnpm --filter @daedalus/frontend exec vitest run src/` — 55 files, 187 passed.
- `pnpm --filter @daedalus/frontend exec playwright test e2e/field-auth.spec.ts --project=chromium` — 10 passed (red first: 10 failed). `e2e/auth.spec.ts --project=chromium` — 14 passed (Console unaffected).
- `pnpm --filter @daedalus/frontend typecheck` and `lint` — clean.

**For integration**
- `MEMBER_TOKEN_SECRET` is now required to boot the backend; a generated value was appended to the git-ignored `apps/backend/.env` so the Playwright web server boots (the value was never displayed). Deployed environments need it set.
- Shared files edited (not rewritten): `routes/index.ts`, `openapi/registry.ts`, `config/env.ts`, both `translations.json`, `App.tsx`, `vitest.setup.ts`, `.env.example`, both READMEs.
- Follow-up for ticket 08: `FieldProjectsPage` is the placeholder to replace; `useMemberQuery` / `fieldFetch` are the hooks and helper to build on.

