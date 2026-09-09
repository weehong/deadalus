# Spec 0001: The Console shell and content layout

Status: completed and verified, 2026-09-09.
Synthesised 2026-09-09 from the requirements
interview recorded in `SPEC.md` §14. Vocabulary follows `CONTEXT.md`
(Administrator, Session, Sign in, Sign out, Console, Project, Subcontractor).
ADR-0001 (Supabase authentication) applies: the Console reads identity from
the Session and never asks the provider or the API for it again.

## Problem Statement

An Administrator who signs in to Daedalus lands on a placeholder that shows
their account id and offers Sign out. There is nowhere to go. The prototype
they were shown has a sidebar with Projects and Subcontractors, an account
block, and a content area with a consistent header row; none of that exists,
so every screen built next would have to invent its own frame.

## Solution

Build the Console frame the prototype's built code shows: a 216px left
sidebar with the brand, the navigation entries and a foot holding the
account block, the language switcher and Sign out. Beside it, a content
column with a shared page container and header row. Signing in lands on
Projects; Projects and Subcontractors exist as honest "not built yet"
screens so navigation is real from day one. On a phone the sidebar becomes a
top bar with a menu toggle and opens as a drawer.

## User Stories

1. As an Administrator, I want to land on Projects after signing in, so that the first screen I see is the top of the hierarchy rather than a proof-of-login page.
2. As an Administrator, I want a sidebar on every Console screen, so that I can reach Projects and Subcontractors from anywhere without using the address bar.
3. As an Administrator, I want the entry for the screen I am on to be visibly marked, so that I always know where I am in the Console.
4. As an Administrator, I want the sidebar to stay in place while a long page scrolls, so that navigation never scrolls out of reach.
5. As an Administrator, I want to see the Daedalus wordmark and the product name "Unit Matrix" in the sidebar, so that I know which tool I am in.
6. As an Administrator, I want to see the email I signed in with and my role in the sidebar, so that I can confirm which account is active before I change anything.
7. As an Administrator with a long email address, I want it truncated rather than overflowing, so that the sidebar keeps its width.
8. As an Administrator, I want a Sign out control in the sidebar foot, so that I can end my Session from any screen.
9. As an Administrator, I want Sign out to show a busy state while it runs, so that I do not press it twice.
10. As an Administrator, I want to be told when Sign out fails, so that I can try again rather than assume I am signed out.
11. As an Administrator, I want to be returned to the Sign in screen after a successful Sign out, so that the next person at the machine cannot see the Console.
12. As an Administrator, I want the language switcher in the sidebar foot, so that I can change language from any Console screen, not only from Sign in.
13. As an Administrator using Chinese, I want the sidebar, the menu toggle, the role label, the page headers and the placeholder notice translated, so that the Console reads in my language.
14. As an Administrator on a phone, I want the sidebar to collapse into a top bar with a menu toggle, so that the content column is not squeezed beside a 216px column.
15. As an Administrator on a phone, I want the menu to open as a drawer over the content, so that I can navigate without losing my place.
16. As an Administrator on a phone, I want the drawer to close when I choose an entry, so that I am not left with the menu covering the screen I asked for.
17. As an Administrator on a phone, I want the drawer to close when I tap outside it, so that dismissing it is one gesture.
18. As a keyboard user, I want the drawer to close on Escape, so that I can dismiss it without reaching for a pointer.
19. As a keyboard user, I want focus to move into the drawer when it opens and back to the toggle when it closes, so that I am never left focused on something hidden.
20. As a screen-reader user, I want the toggle to announce whether the menu is expanded and which region it controls, so that I understand the state before I act.
21. As a screen-reader user, I want the sidebar to be a named complementary landmark and the entries to sit in a named navigation landmark, so that I can jump to them directly.
22. As a screen-reader user, I want exactly one main landmark on a Console screen, so that "jump to main" lands on the page content.
23. As an Administrator, I want Projects to show its kicker, its heading and an honest notice that the screen is not built yet, so that I am not misled by a fake empty state.
24. As an Administrator, I want Subcontractors to do the same, so that both entries lead somewhere real.
25. As an Administrator, I want the disposable example page to render inside the same frame, so that nothing in the Console escapes the shell while it still exists.
26. As an Administrator, I want the example page absent from the navigation, so that a throwaway demo is not presented as a feature.
27. As a visitor without a Session, I want every Console route including Projects and Subcontractors to send me to Sign in, so that nothing behind the guard is reachable by URL.
28. As an already signed-in Administrator visiting Sign in, I want to be sent into the Console, so that I am never asked to authenticate twice.
29. As an Administrator whose Session survives a reload, I want to come back to the Console screen I was on with the sidebar intact, so that a refresh is not disruptive.
30. As an Administrator, I want the Sign in screen to say "Administrator console" and "Enter console", so that the copy names the place I am entering with the glossary's word.
31. As an Administrator, I want the sign-out control to say "Sign out" everywhere, so that it pairs with "Sign in" and the glossary has one verb.
32. As a developer, I want a page container and a header row I can drop into any new Console screen, so that Project, Unit and Subcontractor screens share one rhythm without copying classes.
33. As a developer, I want the header row to take a kicker, a heading and an actions slot, so that "Search" and "New project" style controls have a home from the start.
34. As a developer, I want the sidebar, its entries, the account block and the shell to render in Storybook without a router or a Session, so that I can see and adjust them in isolation.
35. As a developer, I want each layout primitive to have a story and a test beside it, so that the convention set by the sign-in primitives holds.
36. As a developer, I want the shell to know nothing about the router beyond the current path, so that swapping the sidebar for a top bar later is one component.
37. As a developer, I want the navigation entries defined in one place as data, so that adding an entry does not touch the shell.
38. As a developer, I want the dead identity query and its end-to-end intercept removed, so that the frontend has no code path that is never exercised.
39. As a developer, I want the backend `/me` route and its tests kept, so that the bearer-token round trip remains proven on the API side.
40. As a developer, I want the end-to-end suite to sign in through the intercepted provider and then exercise the real sidebar, so that the flow is covered without a real account.
41. As a developer, I want SPEC.md and README to describe the Console as built, so that the next session starts from the truth.

## Implementation Decisions

- **Reference.** The prototype's built `StaffShell` (216px sticky left sidebar) is the reference, not the top bar described in its design handoff document.
- **Shell.** From Tailwind's `md` breakpoint (768px) up, a 216px sidebar sticks to the left for the full viewport height with the content beside it. Below `md`, a slim sticky top bar carries the wordmark and a menu toggle; the same sidebar element becomes a fixed overlay drawer. One sidebar element, class-toggled, so there is one landmark rather than two copies.
- **Drawer behaviour.** Open state lives in the shell. It closes on Escape (keydown inside the drawer), on a backdrop click, on the toggle, and whenever the current path passed in as a prop changes. Focus moves to the drawer element on open and returns to the toggle on close. The toggle carries `aria-expanded` and `aria-controls`; the drawer element exposes `data-state` for tests. The backdrop is pointer-only and hidden from assistive technology.
- **Landmarks.** The shell owns the single `main`. The sidebar is an `aside` with an accessible label; the entries sit in a labelled `nav`. The example page's own `main` becomes a plain container.
- **Sidebar module.** Purely presentational: it takes the sub-label, the navigation landmark's label, a navigation slot and a foot slot. The brand (logo plus sub-label "Unit Matrix") is fixed inside it.
- **Navigation entry.** A plain anchor that spreads its props, so the router's link factory can wrap it. Its active style keys off `aria-current="page"`, which the router sets on the matching route. Styling follows the prototype: left accent rule and tinted background when active, tinted hover otherwise.
- **Account block.** Takes an email and a role label. Initials are derived inside from the email's local part: first letters of the first two words, or the first two letters of a single word, upper-cased; an empty email yields no initials. The email truncates with a title attribute carrying the full value. Initials are hidden from assistive technology.
- **Identity source.** The account block reads the Session's user email from the Zustand read model, synchronously, so it renders on first paint with no pending state. The `useMeQuery` hook is deleted; `GET /api/v1/me` stays on the backend as the round-trip proof.
- **Wired layer.** A console feature module supplies: the navigation entries as data (label and typed route target), a router-aware link built from the presentational entry via the router's link factory, and a layout component that reads the current path, the Session's email and translations, holds the Sign out pending and failed state, and renders the shell with the sidebar and an outlet. The pathless `_console` layout route renders this layout component, keeping its Session guard.
- **Sign out.** Ghost button in the foot. While pending it shows "Signing out…" and refuses presses. On failure an inline alert appears under it. On success the router navigates to Sign in.
- **Routes.** The Console index redirects to Projects in `beforeLoad`, so the landing route has one owner; Sign in and the sign-in success handler keep targeting the root. Projects and Subcontractors are new children of the layout route. The example route is unchanged.
- **Placeholder pages.** Each renders the page container, the header row (kicker "Portfolio" / "Directory", heading "Projects" / "Subcontractors") and a framed notice "This screen is not built yet." No search box, no disabled primary action.
- **Content primitives.** Page: centred, 1400px cap, the prototype's padding, accepts extra classes. PageHeader: optional kicker over an `h1`, optional actions slot, wrapping when narrow. Placeholder: a blueprint-framed notice. Breadcrumb is deferred.
- **Button.** Accepts a ref so the shell can return focus to the toggle; otherwise unchanged.
- **Copy and locales.** "Log out" strings become "Sign out" / "Signing out…" / "Could not sign out. Try again."; the sign-in kicker and submit become "Administrator console" / "Enter console"; the old placeholder `console.*` keys are replaced by sub-label, sidebar and navigation labels, menu and close-menu labels, role, not-built notice, entry labels and both pages' kicker and heading. zh-CN gets machine-translated equivalents, flagged in the file as before.
- **Documentation.** SPEC.md §14 records the decisions (done). README's sign-in section and its "example slice is disposable" list are updated to drop the placeholder page reference and the `/me` intercept.

## Testing Decisions

- **What a good test is.** It drives the component or the browser the way an Administrator would and asserts on what they perceive: landmarks, names, current-page marks, expanded state, focus, visible text and the URL. It never reaches into state, class names beyond a single layout assertion, or the router's internals.
- **Highest seam: Playwright through the intercepted provider.** Prior art is the existing auth spec, which fulfils the Supabase token, user and logout endpoints at the browser's edge and leaves everything else real. Cover: guarded route to Sign in and back to Projects after credentials; the sidebar's navigation landmark and the account block showing the email; Projects marked current, navigating to Subcontractors and seeing its heading; Sign out posting to the provider and returning to Sign in; reload keeping the Session and landing on the same Console screen; on a phone viewport the toggle opening the drawer, choosing an entry closing it. The `/api/v1/me` intercept is removed from both specs; the example spec reaches the example page by URL since no link exists.
- **Component seam: React Testing Library.** Prior art is the sign-in primitives' tests (Alert, LanguageSwitcher, BrandPanel, SplitLayout), which use real translations and role-based queries. One test file beside each new component: Page, PageHeader, Placeholder, NavItem, AccountBlock (including the initials function's three cases), Sidebar, and ConsoleShell (landmarks, initial closed state with toggle wiring, open then Escape with focus movement, toggle-to-close, close on path change).
- **Stories.** One story file beside each new component, rendered without a router or Session; the shell has a phone-viewport story.
- **Not tested in isolation.** The wired layout component, whose behaviour is covered end to end.

## Out of Scope

- Breadcrumbs, until the Project screen needs them.
- Real Projects and Subcontractors screens, their data models, search and primary actions.
- The "Subcontractor view" entry point and the whole Subcontractor flow.
- A display name or role from the API; the account block shows the email until identity carries more.
- Body scroll locking and a full focus trap inside the drawer.
- Any ADR: nothing here is hard to reverse.

## Further Notes

- Ticket status and acceptance evidence are recorded in the [verification notes](0001-console-shell-verification.md).
- The implementation began from an unfinished working-tree draft written before this spec. Tickets T1–T6 and the T4b authentication-boundary correction are complete, reviewed and integrated. Component coverage includes single-main composition, account initials, navigation semantics and drawer dismissal with focus return; provider-edge regressions verify that failed Sign out preserves the Session for retry.
- The root and frontend READMEs describe the Console, direct access to the disposable example, Session-based account identity and the provider interception seam. Combined verification passed: 96 unit tests, 45 browser cases across Chromium, Firefox and WebKit, lint, typecheck, production builds, changed-source formatting and strict browser-test typechecking. Storybook also built successfully. Independent standards and spec reviews reported zero findings, with all 41 user stories covered.
- `CONTEXT.md` already carries Sign out and Console; no glossary work remains. Unrelated changes were preserved; no commits, staging or pushes were performed.
