# Spec: Daedalus Ops sign-in screen

## Problem Statement

Daedalus Ops has no way for anyone to get in. The application is a boilerplate shell:
every route is public, there is no notion of who is looking at it, and the product has
no visual identity of its own. An Administrator responsible for the work orders, asset
health and incident history across a set of Sites cannot establish who they are, and the
console cannot distinguish them from an anonymous visitor.

Separately, the design for the console exists only as a static prototype built almost
entirely from inline styles. Nothing in that prototype is reusable. Every screen that
follows — the work-order table, the KPI cells, the incident queue — repeats the same
framed, corner-marked, hairline-bordered objects, and without a shared component layer
each one will re-implement them slightly differently.

## Solution

Build the sign-in screen for Daedalus Ops, and build it out of a genuine, reusable
design-system component layer rather than a one-off page.

An Administrator arriving at the console is met with a two-column screen: a solid steel
brand panel carrying the Daedalus Ops identity, a headline, a short description of what
the console covers, and a row of headline figures; and, beside it, a framed sign-in card
asking for a work email and a password. Signing in with valid credentials admits them to
the console and returns them to whatever they were originally trying to reach. Invalid
credentials produce a clear, deliberately non-specific message. The screen works in
English and Simplified Chinese, adapts to narrow viewports, and is fully operable by
keyboard and screen reader.

Underneath, the screen is assembled from primitives — a blueprint frame, a button, an
input, a labelled field, an alert, the brand mark, a figure grid, a language switcher and
a split layout — each of which stands alone with its own story and tests, ready for the
dashboard screens that follow.

## User Stories

### Signing in

1. As an Administrator, I want a dedicated sign-in screen, so that I know where to go to
   access Daedalus Ops.
2. As an Administrator, I want to sign in with my work email and password, so that I can
   use the credentials I already have.
3. As an Administrator, I want the email field focused or clearly first in tab order, so
   that I can start typing immediately without reaching for the mouse.
4. As an Administrator, I want my browser's password manager to offer to fill and save my
   credentials, so that I do not have to type them on every visit.
5. As an Administrator, I want to submit the form by pressing Enter, so that I do not have
   to move to the button.
6. As an Administrator, I want the submit button to show that it is working and to refuse
   a second press, so that I do not accidentally submit twice on a slow connection.
7. As an Administrator, I want to be taken into the console immediately on success, so
   that signing in feels like one action rather than two.
8. As an Administrator who was trying to reach a specific page before being asked to sign
   in, I want to land on that page afterwards, so that I do not lose my place.
9. As an Administrator, I want my session to survive a page reload and a new tab, so that
   I am not asked to sign in repeatedly during a shift.
10. As an Administrator who is already signed in, I want to be moved on if I navigate to
    the sign-in screen, so that I am never asked to authenticate twice.
11. As an Administrator reloading the console, I want to not see the sign-in screen flash
    before my session is recognised, so that the application does not appear to log me out.

### Passwords

12. As an Administrator, I want to reveal my password, so that I can check what I typed
    when a sign-in fails.
13. As an Administrator using a screen reader, I want the reveal control to announce
    whether the password is currently shown or hidden, so that I know the state of the
    field I am editing.
14. As an Administrator, I want the reveal state to reset rather than persist, so that my
    password is not left visible on a shared machine.

### Errors and validation

15. As an Administrator, I want to be told when my email is not a valid address before the
    form is submitted, so that I can fix an obvious typo without waiting on the network.
16. As an Administrator, I want to be told when I have left a field empty, so that I am not
    confused by a rejected sign-in.
17. As an Administrator, I want field-level problems shown against the field they belong to,
    so that I know which one to correct.
18. As an Administrator, I want a failed sign-in to produce a single clear message, so that
    I understand the attempt was rejected.
19. As a security-conscious operator of the console, I want a failed sign-in to give the
    same message whether the account exists or the password was wrong, so that the screen
    cannot be used to discover which email addresses have accounts.
20. As an Administrator who has attempted too many times, I want to be told that I am rate
    limited and should wait, so that I stop retrying pointlessly.
21. As an Administrator whose network or the authentication service is unavailable, I want
    to be told that specifically, so that I do not assume my password is wrong.
22. As an Administrator using a screen reader, I want a failed sign-in announced without
    moving my focus, so that I learn what happened without losing my place in the form.
23. As an Administrator, I want the error to clear when I correct my input and try again,
    so that stale messages do not confuse me.

### Identity and content

24. As an Administrator, I want the screen to carry the Daedalus Ops identity, so that I
    know I am signing in to the right system.
25. As an Administrator, I want the browser tab to say Daedalus Ops, so that I can find the
    console among many open tabs.
26. As an Administrator, I want a short statement of what the console covers, so that a
    new colleague understands what they are being given access to.
27. As an Administrator without an account, I want to be told how to get one, so that I
    know to contact my site administrator rather than looking for a sign-up form.

### Language

28. As a Chinese-reading Administrator, I want the sign-in screen in Simplified Chinese, so
    that I can use the console in my own language.
29. As an Administrator whose browser is set to a language variant we do not carry, I want
    a sensible language rather than an error or raw keys, so that the screen is always usable.
30. As a Traditional-Chinese-reading Administrator, I want not to be silently served
    Simplified Chinese, so that I am not given text in the wrong script.
31. As an Administrator on a machine whose browser language is not mine, I want to switch
    language on the sign-in screen itself, so that I am not stuck before I can reach any
    account setting.
32. As an Administrator, I want my language choice remembered, so that I do not reselect it
    on every visit.
33. As an Administrator using assistive technology, I want the page's declared language to
    match what is displayed, so that my screen reader pronounces the content correctly.

### Layout and access

34. As an Administrator on a phone or a narrow window, I want the screen to stack into one
    readable column, so that I can sign in from any device.
35. As an Administrator on a desktop, I want the full two-column composition, so that the
    screen reads as designed.
36. As an Administrator navigating by keyboard, I want a clearly visible focus indicator on
    every interactive element, so that I always know where I am.
37. As an Administrator using a screen reader, I want every field to have a programmatically
    associated label, so that I know what I am filling in.

### Building on it

38. As a developer, I want the visual primitives extracted into standalone components, so
    that the dashboard screens can reuse them rather than reproducing them.
39. As a developer, I want each primitive to have a story, so that I can see its variants
    and states without running the application.
40. As a developer, I want the brand panel to take its copy and figures as data, so that the
    same layout serves other contexts without a fork.
41. As a developer, I want the sign-in form to have no knowledge of the authentication
    provider, so that it can be rendered and tested in isolation.
42. As a developer, I want the authentication provider confined to a small, named boundary,
    so that replacing it later is a contained change.
43. As a developer, I want colours, type and spacing to come from the design system's own
    tokens, so that a change to the system propagates rather than needing a hunt for
    hard-coded values.
44. As a developer, I want the reasoning behind the design-system and authentication choices
    recorded, so that a future reader does not undo them by accident.
45. As a developer, I want the existing demo pages and their end-to-end tests to keep working,
    so that this change does not leave a broken suite behind.

## Implementation Decisions

### Design system

- The Industry design system's stylesheet is **vendored into the project verbatim** and
  treated as the source of truth for tokens and primitive classes. The alternative — porting
  the whole system to utility classes — was rejected as forking the system on day one. This
  is recorded in an ADR.
- Its tonal ramps are **mirrored into the Tailwind v4 theme layer** so utilities resolve to
  the same values. The ramp steps keep their names verbatim. The four role tokens are
  **renamed in the Tailwind layer only** for readable utility names: the ground becomes
  `canvas`, the text colour becomes `ink`, the divider becomes `rule`, and the surface keeps
  its name. The mapping is commented at the point of definition. The vendored stylesheet
  keeps its original names untouched.
- Spacing and radius are **not** mirrored; layout uses Tailwind's own scale. Only colour and
  type cross into the theme layer.
- The Tailwind v3-style JavaScript config file is deleted; it is inert under Tailwind v4's
  CSS-first configuration.
- The system defines a single light ground and no dark ramp. **The console is light-only.**
  Storybook's light/dark class decorator is removed rather than left inert.
- **Two documented deviations** from the vendored file, noted in a header comment so a future
  re-vendor knows what to re-apply:
  1. The remote web-font import is removed in favour of self-hosted font packages, because a
     stylesheet `@import` after the Tailwind import is dropped by the browser, and because an
     internal console should not depend on a third-party CDN at page load.
  2. System CJK families are appended to the heading and body font stacks. The system's faces
     carry no Chinese glyphs; bundling a CJK web font was rejected on weight.

### Component layer

Three tiers, each component in its own folder with a story, tests and an export barrel, per
the existing repository convention.

- **UI primitives** (no application knowledge): a *blueprint frame* wrapper rendering the
  hairline border plus four corner registration marks and accepting a polymorphic element
  type; a *button* with primary, secondary, ghost and icon variants plus block, framed and
  pending flags; an *input* forwarding its ref so form registration works; a *field* pairing
  a label, a control and an error message with the correct `for`, `aria-invalid` and
  `aria-describedby` wiring; an *alert* rendering an assertive live region; a *logo* pairing
  the square mark with the wordmark at two sizes; a *figure grid* rendering the hairline
  three-cell statistic row; and a *language switcher*.
- **Layout**: a *split layout* implementing the two-column composition with the design's
  asymmetric ratio, stacking to a single column below the medium breakpoint. It is generic —
  it takes an aside and children and knows nothing about authentication.
- **Feature components**: a *brand panel* composing logo, kicker, headline, blurb and figure
  grid, taking **all** copy and figures as props with the Daedalus Ops values supplied from a
  content module; and a *sign-in form* built on the project's existing form and schema
  libraries, which takes a submit handler, an error and a pending flag as props and
  **imports nothing from the authentication provider**.
- A *sign-in page* composes the layout, panel and form and is the **only** module aware of
  authentication.

The blueprint frame and figure grid live in the shared UI tier rather than inside the
authentication feature, because the dashboard reuses the same framed object on every card
and KPI cell.

### Authentication

- **Supabase** is the authentication provider, using email-and-password sign-in. Recorded in
  an ADR. Configuration comes from two environment variables — the project URL and the
  publishable anonymous key — declared in the example environment file and the environment
  type declarations. The service-role key must never enter this codebase.
- The provider client is created in **one module**. A thin authentication API module wraps
  sign-in and is the only caller of it.
- Session state is **mirrored into the existing store layer**: a single subscription to the
  provider's auth-state change stream writes the session into a store, so no component
  imports the provider. The provider remains the persistence mechanism; the store is a
  read model.
- Because the initial session resolves asynchronously, the application root holds an explicit
  **restoring** state until the first auth-state event arrives, so a reload does not flash the
  sign-in screen.
- Routes are guarded in the router's **pre-load hook**, reading the store through router
  context so the decision is synchronous and the guarded component never mounts.

### Validation and errors

- The sign-in schema validates **shape only**: the email must be a well-formed address; the
  password must be non-empty. No length or complexity rule is applied at sign-in — that would
  disclose the password policy and would lock out anyone whose password predates a policy
  change. Policy belongs at password-set time.
- Provider errors are normalised by a **pure mapping function** into a small closed set:

  ```
  InvalidCredentials  ← any 400-class credential rejection, including "email not confirmed"
  RateLimited         ← 429
  Unavailable         ← network failure or 5xx
  Unknown             ← anything else
  ```

  `InvalidCredentials` deliberately collapses distinguishable provider messages into one
  user-facing message so the screen cannot be used to enumerate accounts. `RateLimited` and
  `Unavailable` stay distinct because they are actionable.
- The mapped error renders in the alert primitive above the fields as an assertive live
  region; focus is not moved. Field-shape errors render inline within their field.

### Routing

- The sign-in route is **public**. The console root is **guarded**.
- An unauthenticated visitor to a guarded route is redirected to sign-in with the intended
  destination carried in a query parameter, and is returned there after a successful sign-in.
- An authenticated visitor to the sign-in route is redirected to the console root.
- The boilerplate demo feature is **moved to its own route** rather than deleted, freeing the
  root for the guarded console landing while keeping the demo and its end-to-end tests alive
  as a working reference. Deleting the demo is deliberately deferred.

### Screen composition and copy

- Left column: solid deep-accent field, reversed type. Logo, kicker, condensed headline,
  short blurb, and a three-cell hairline figure grid.
- Right column: the framed sign-in card carrying a kicker, a heading, a subtitle, the email
  and password fields, a full-width framed primary submit button, and a closing line telling
  a visitor without an account to ask their site administrator for access. The prototype's
  "any credentials will sign you in" note is removed.
- The password field carries an in-field reveal toggle.
- The language switcher sits at the foot of the form column.
- **Not included**: remember-me (the provider persists sessions already), a sign-up link
  (Administrators are provisioned, not self-serve), and a forgot-password link (the reset
  flow is out of scope, and a link to nothing is a broken promise).

### Internationalisation

- Locales are **`en-US` and `zh-CN`**. The existing `es` locale is deleted. The rename touches
  the statically bundled resource map, the type declarations that derive key typing from the
  English resource, the fallback language, and the backend load path.
- Non-explicit locale matching is enabled so bare and regional variants resolve to the
  supported locales, with **Traditional Chinese variants explicitly excluded** so their readers
  fall back to English rather than being served Simplified script.
- The document's declared language is kept in sync with the active language.
- The switcher persists the choice where the language detector reads it first.
- Chinese is authored for the **authentication strings only**, machine-translated and flagged
  for review. The boilerplate demo strings stay English; they are scheduled for deletion and
  translating them wastes review attention.

### Shell rebranding

The document title and language attribute, and the package name and description, are updated
to Daedalus Ops, along with the end-to-end assertion that checks the title. The project readme
is a separate rewrite and is not touched.

## Testing Decisions

### What makes a good test here

A good test states something an Administrator or a consuming developer could observe: what is
rendered, what is announced, what happens when a control is used, where a navigation lands. It
finds elements by role, label and text — the same handles assistive technology uses — never by
class name, test id or component internals. It does not assert that a particular hook was
called, that state has a particular shape, or that a child component received particular props.
Restyling a component or renaming an internal function must not break a test; changing what an
Administrator sees or can do must.

### Seams

**Exactly one seam: the authentication provider's HTTP boundary**, intercepted with the
end-to-end runner's request routing. This is the outermost real dependency, and intercepting
there means the tests exercise the real client, the real store, the real guard and the real
form.

There is **no module mocking anywhere in the unit suite**. No test-only injection point is added
to application code. Everything else is reachable as a pure unit because of how the components
are decomposed: the sign-in form receives its submit handler, error and pending flag as props;
the error mapping is a pure function over a provider error; the schema is a value; the store is
plain state given a session.

The accepted cost: the page wiring, the guard and the redirect round-trip are covered only by
end-to-end tests, which are slower than unit tests. This was chosen over adding a request-
mocking library to the unit suite, in order to keep the seam count at one.

### Unit tests

- **UI primitives** — thin. Each renders its content, applies the variant it was given, exposes
  the right role, and forwards its ref where it takes one. The field primitive is tested for the
  label association and error wiring it exists to guarantee. The alert is tested for its live
  region. The blueprint frame is tested for its corner marks and its polymorphic element.
- **Sign-in form** — deep. Submitting empty shows both required messages and does not call the
  handler. A malformed email is rejected before the handler is called. A valid submission calls
  the handler with the entered values. While pending, the submit control is disabled and
  indicates progress. A supplied error renders in the alert. The reveal toggle changes the
  field's type and its own announced state.
- **Error mapping** — a table of provider errors against expected mapped values, including the
  deliberate collapse of distinguishable credential errors into one.
- **Schema** — valid and invalid addresses; empty password rejected; no length rule enforced.
- **Brand panel** — renders supplied copy and figures; renders the figure count it is given.
- **Language switcher** — changes the active language and persists the choice.
- **Session store** — records a session, clears it, and reports its restoring state.

### End-to-end tests

At the single seam, with the provider's token endpoint intercepted:

- A visitor to a guarded route is redirected to sign-in with the intended destination preserved.
- A successful sign-in lands on that preserved destination.
- A successful sign-in from a direct visit lands on the console root.
- A rejected sign-in shows the generic message and stays on the screen.
- A rate-limited response shows the rate-limit message.
- An already-authenticated visitor to the sign-in route is redirected away.
- The relocated demo route and its existing assertions continue to pass.

### Prior art

The repository's existing end-to-end spec is the model for navigation and title assertions.
The existing example feature's form is the model for the form library and schema-resolver
conventions. The existing component folder convention — component, story, test, barrel — is
followed without deviation.

## Out of Scope

- The signed-in console itself. The guarded root is a placeholder; no sidebar, KPI cells,
  work-order table, incident queue or status page is built.
- Password reset, password change, and any email-based flow.
- Self-service sign-up, invitations, and Administrator provisioning.
- Roles, permissions and authorisation. This spec establishes *who* is signed in, not *what*
  they may do.
- Multi-factor authentication, single sign-on, and OAuth providers.
- Sign-out. There is no signed-in surface to sign out from yet.
- Session expiry and refresh handling beyond what the provider client does by default.
- Deleting the boilerplate demo feature, and rewriting the project readme.
- A dark theme.
- Translating the boilerplate demo strings into Chinese.
- Provisioning the actual Supabase project, and any database schema or row-level security
  policy. The screen is built against configuration placeholders.

## Further Notes

- **The feature cannot be exercised against a real provider until the project exists.** The
  environment variables are declared but unset. Stories, unit tests and the intercepted
  end-to-end suite all pass regardless; a genuine sign-in does not work until real values are
  supplied.
- **The self-hosted font packages are unverified.** If they do not publish the weights the
  design system asks for, the fallback is a document-level stylesheet link — the same one-line
  deviation from the vendored file, delivered differently. This is the one decision most likely
  to need revisiting during implementation.
- **The unconfirmed-email case is knowingly degraded.** Collapsing it into the generic message
  is correct against account enumeration, but if provisioning ever sends confirmation emails, a
  legitimate Administrator will be stuck without a useful message. Revisit if provisioning
  changes.
- **The Traditional Chinese exclusion is a judgement call.** Readers in Taiwan and Hong Kong
  will get English. If the console gains users there, serving Simplified is the better failure
  and the exclusion should be dropped.
- **The renamed role tokens are one indirection.** A developer reading the vendored stylesheet
  sees one set of names and a developer reading a component sees another. The mapping comment
  at the definition site is the mitigation; if it proves confusing, mirroring the names verbatim
  is a cheap reversal.
- Two ADRs accompany this work: one for vendoring the design system rather than porting it, and
  one for the choice of authentication provider and the shape of session ownership.
