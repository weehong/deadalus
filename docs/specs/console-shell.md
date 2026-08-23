# Spec: Daedalus Ops console shell and sidebar

## Problem Statement

A signed-in Administrator lands on a bare placeholder. Daedalus Ops has a way in — the
sign-in screen — but nothing on the other side of it: no way to tell which part of the
console they are looking at, no way to move between work orders, system status, assets,
operators and settings, and no frame into which those screens can be dropped as they are
built. Every screen that follows needs the same surrounding structure, and without it each
one would have to invent its own.

Separately, the only reference for that structure is a static prototype: a 1440px-wide
mock with a dark left rail, inline styles, placeholder identity ("Meridian Ops"), a region
label with no meaning in the product, and fictional counts and sync times. Nothing in it is
reusable, nothing in it is translated, and nothing in it works below desktop width.

## Solution

Build the persistent shell of the console: a dark, full-height sidebar on the left carrying
the Daedalus Ops identity, the primary navigation, and a small status band; and a guarded
layout that wraps every console screen, so that signing in lands the Administrator inside a
navigable console rather than on a page.

The sidebar lists six destinations — Overview, Work orders, System status, Assets,
Operators, Settings — each with an icon, a label and, where relevant, a count. The current
destination is visibly marked. Clicking any item moves to that screen; screens that do not
exist yet are simple titled pages so the whole console is navigable end to end from day one.
The status band tells the Administrator when the console last synchronised and, when it is
the case, how many services are impaired.

Below the medium breakpoint the sidebar withdraws into a drawer behind a menu button in a
slim top bar, so the console remains usable on a tablet or narrow window. The shell works in
English and Simplified Chinese and is fully operable by keyboard and screen reader.

The session guard moves from the individual route onto the layout, so that every screen
inside the shell is protected by one rule rather than one copy of it per screen.

The header strip from the prototype — search, notifications, the signed-in Administrator —
is the next step, not this one.

## User Stories

### Getting around

1. As an Administrator, I want a sidebar that is present on every console screen, so that I
   always have the same way to move around.
2. As an Administrator, I want to see Overview, Work orders, System status, Assets,
   Operators and Settings listed in the sidebar, so that I know what the console covers.
3. As an Administrator, I want each destination to have an icon as well as a label, so that I
   can recognise it at a glance.
4. As an Administrator, I want the destination I am on to be visibly marked, so that I know
   where I am.
5. As an Administrator viewing a specific work order, I want Work orders to stay marked as
   current, so that the sidebar reflects the section I am in rather than the exact page.
6. As an Administrator on the Overview, I want only Overview marked, so that the landing
   screen is not confused with the sections beneath it.
7. As an Administrator, I want to click a sidebar item and arrive on that screen, so that
   navigation is one action.
8. As an Administrator, I want every listed destination to lead somewhere, so that the
   sidebar never offers a dead link.
9. As an Administrator arriving at a destination that has not been built yet, I want a plain
   page bearing its name, so that I understand I am in the right place and the content is
   simply not there yet.
10. As an Administrator, I want the console to open on Overview after I sign in, so that the
    landing screen is the summary.

### Counts

11. As an Administrator, I want to see a count beside Work orders and System status, so that
    I know how much is waiting without opening each section.
12. As an Administrator, I want a count of a thousand or more shown as "999+", so that a
    large number does not distort the sidebar.
13. As an Administrator using a screen reader, I want the count announced as part of the
    item ("Work orders, 148"), so that I hear the number with the thing it counts.
14. As an Administrator, I want items with nothing to count to show no count, so that the
    absence of a number is not mistaken for zero.

### Identity and context

15. As an Administrator, I want the Daedalus Ops mark and name at the top of the sidebar, so
    that I know which system I am in.
16. As an Administrator, I want to see the scope I am looking at ("All sites") beneath the
    name, so that I know which Sites the console is reporting on.
17. As an Administrator, I want the console to never show its prototype placeholder identity,
    so that the product reads as itself.

### Status

18. As an Administrator, I want to see when the console last synchronised, so that I know how
    fresh what I am looking at is.
19. As an Administrator, I want to see how many services are impaired when any are, so that I
    am warned before I trust a number that depends on them.
20. As an Administrator, I want no impairment line when no services are impaired, so that the
    band carries only what is true.
21. As an Administrator, I want the sync time and impairment count to be real, not the
    prototype's fixed values, so that the status band never lies to me.

### Narrow viewports

22. As an Administrator on a tablet or narrow window, I want the sidebar to withdraw behind a
    menu button, so that the screen content has the width.
23. As an Administrator on a narrow window, I want a slim top bar carrying the Daedalus Ops
    mark and the menu button, so that the identity and the way in are never lost.
24. As an Administrator on a narrow window, I want the opened sidebar to close when I choose a
    destination, so that I see the screen I asked for.
25. As an Administrator on a narrow window, I want the opened sidebar to close on Escape and
    on tapping outside it, so that I can dismiss it the way I dismiss anything else.
26. As an Administrator on a narrow window, I want focus held inside the open drawer and
    returned to the menu button on close, so that keyboard and screen-reader use is not lost
    behind it.
27. As an Administrator on a narrow window, I want the page behind the drawer to stop
    scrolling while it is open, so that the drawer stays put.
28. As an Administrator on a desktop, I want the sidebar always present and fixed to the
    viewport, so that it stays put while the content scrolls.

### Access

29. As an Administrator without a Session, I want any console screen to send me to sign in and
    bring me back afterwards, so that the guard is the same on every screen.
30. As an Administrator with a Session, I want to reach any console screen directly by URL, so
    that I can bookmark and share links.
31. As an Administrator navigating by keyboard, I want a "Skip to content" link as the first
    focusable element, so that I am not walked through the sidebar on every page.
32. As an Administrator navigating by keyboard, I want a clearly visible focus indicator on
    every sidebar item and control, so that I always know where I am.
33. As an Administrator using a screen reader, I want the sidebar announced as navigation and
    the current item announced as current, so that the structure is legible without sight.
34. As an Administrator using a screen reader, I want the menu button to announce whether the
    drawer is open, so that I know its state.

### Language

35. As a Chinese-reading Administrator, I want the sidebar labels, scope and status band in
    Simplified Chinese, so that I can use the console in my own language.
36. As an Administrator, I want the impairment line to pluralise correctly in each language,
    so that "1 service impaired" and "2 services impaired" both read properly.

### Building on it

37. As a developer, I want the sidebar to be a presentational component that takes its items,
    scope and status as data, so that the shell can feed it real counts later without
    touching the component.
38. As a developer, I want the navigation configuration in one place, so that adding a
    destination is one edit.
39. As a developer, I want the session guard on the layout route rather than on each screen,
    so that new screens are protected by default.
40. As a developer, I want each new component to have a story and tests, so that I can see
    its variants — default, impaired, drawer — without running the application.
41. As a developer, I want the stub pages to be trivially replaceable, so that building a real
    screen is a matter of swapping a component.
42. As a developer, I want the existing sign-in flow, demo route and their tests to keep
    working, so that this change leaves no broken suite behind.

## Implementation Decisions

### Routing

- A **pathless layout route** wraps every console screen. It owns the session guard in its
  pre-load hook — an Administrator without a Session is redirected to sign-in with the
  intended destination carried in the query, exactly as the guarded root does today — and it
  renders the sidebar, the narrow-viewport top bar, the skip link and the outlet for the
  screen. The per-route guard on the console root is removed, since the layout now covers it.
- Six child routes sit under the layout: the console root (Overview), and Work orders,
  System status, Assets, Operators and Settings at kebab-case paths named after their labels.
  Overview keeps the existing placeholder page; the other five each render one heading
  carrying the destination's translated label and nothing else.
- The boilerplate demo route stays outside the shell, unguarded and untouched. Deleting it is
  a separate cleanup.
- **Blueprints**, present in the prototype as a cross-link to a different prototype, is not a
  destination in Daedalus Ops and is dropped.

### Sidebar component

- A **`Sidebar`** in the layout tier, presentational, taking three things as data: the list
  of navigation items, a scope label, and a status. It knows nothing about the session, the
  router's route tree, or where its data comes from.
- Each item is a **`SidebarItem`**: a router link with an icon, a label and an optional count.
  Overview matches exactly; every other item matches by prefix, so a nested page keeps its
  section lit. The current item carries `aria-current="page"` and the prototype's treatment
  — a hairline border and a translucent wash on the dark ground.
- Counts render as tabular numerals, dimmed on non-current items, capped at "999+" above
  999, and are part of the link's accessible name ("Work orders, 148"). An item with no count
  renders no count element.
- The brand band reuses the existing **Logo** component and shows the scope label beneath it
  in the small uppercase tracking style the prototype uses.
- A **`SidebarStatus`** band at the foot: a "Last sync" row with a clock time, and an
  impairment row — coloured marker plus pluralised text — rendered only when an impairment
  count is supplied.
- **No `SidebarSection`** (the prototype has no grouping), and no desktop collapse-to-rail
  toggle (the prototype has none).
- Navigation items are defined once in a console feature module — label key, path, icon,
  exact-match flag, placeholder count — and handed to the sidebar by the layout.
- Icons come from the already-installed outline icon set at 16px: Overview → grid of
  squares, Work orders → clipboard with list, System status → signal, Assets → cube,
  Operators → users, Settings → cog. The icon package and the headless dialog package are
  promoted from development to runtime dependencies, since the application now ships them.

### Status band data

- The sync time is the **moment the shell mounted**, formatted `HH:mm` with the project's
  date library — honest today, and the same prop a real sync clock will feed later.
- The shell passes **no impairment count** today, so the impairment row is absent in the
  running application. The story shows the impaired variant.
- Counts beside Work orders and System status are **static placeholders** supplied by the
  navigation configuration; wiring them to data is a later step.

### Narrow viewports

- Below the medium breakpoint the sidebar is hidden and the layout renders a **slim top bar**
  — Logo plus a menu button — that will later fold into the real header.
- The menu button opens the same `Sidebar` inside a **headless dialog** for focus trap,
  Escape handling, backdrop dismissal and scroll lock. Any navigation click closes it. The
  button exposes `aria-expanded`.
- At and above the breakpoint the sidebar is 236px wide, sticky to the viewport top, full
  viewport height, with the navigation region scrolling internally if it ever overflows.

### Visuals

- Dark ground on the `steel-900` step with the canvas colour for text, matching the sign-in
  brand panel rather than the prototype's bluish accent ramp; hairlines and the active wash
  are white at the prototype's alpha ratios. Heading face for the wordmark, body face
  elsewhere, sizes as in the prototype.
- A visually hidden **skip link** precedes the sidebar and targets the main content region.

### Internationalisation

- Navigation labels, the scope label, and the status band strings are added to both locales.
  The impairment string uses the i18n library's plural forms. Chinese strings are authored
  with the change and flagged for review, as for sign-in.

## Testing Decisions

### What makes a good test here

A good test states what an Administrator or a consuming developer can observe: what is
rendered, what is announced, what happens when a control is used, where a navigation lands.
It finds things by role, name and text; never by class, test id or internals. Restyling the
sidebar must not break a test; changing what an Administrator sees or can do must.

### Seams

The **single seam established by the sign-in spec is kept**: the authentication provider's
HTTP boundary, intercepted by the end-to-end runner. The guard, the layout, the real route
tree and the real sidebar are exercised through it.

**No new seam is added.** The sidebar's links need a router to render, so unit tests mount
them inside the real router with an in-memory history and a small test route tree — the
framework's own testing affordance, a configuration rather than a substitution. No module is
mocked and no test-only injection point enters application code. Drawer behaviour is tested
by rendering the sidebar at a narrow viewport width in the same way.

### Unit tests

- **`SidebarItem`** — renders icon, label and count; omits the count element when none is
  given; caps at "999+"; accessible name includes the count; carries `aria-current="page"` when
  its path is current and not otherwise; prefix matching lights a nested path, exact matching
  does not.
- **`Sidebar`** — renders the navigation landmark with every supplied item in order; shows the
  Logo and scope label; shows the last-sync time; shows the impairment line only when a count
  is supplied, pluralised correctly.
- **Drawer** — the menu button opens the dialog containing the navigation; Escape, backdrop
  and choosing an item each close it; focus returns to the button; `aria-expanded` tracks
  state.
- **Navigation configuration** — the six destinations, in order, with the expected paths and
  exact-match flags.

### End-to-end tests

At the existing seam, with the provider's token endpoint intercepted:

- A visitor without a Session to each of the six console paths is redirected to sign-in with
  that path preserved, and lands back on it after signing in.
- From Overview, clicking each sidebar item lands on its path, shows its heading, and marks it
  current.
- The sign-in, demo and existing assertions continue to pass.

### Prior art

The end-to-end auth spec's faked-session interception is the model for the new navigation
spec. The split layout and language switcher tests are the model for rendering and
interaction assertions. The component folder convention — component, story, test, barrel — is
followed without deviation.

## Out of Scope

- The header strip: search, notifications, the signed-in Administrator's name and mark, and
  **sign-out**. The next step.
- Real data for the counts, the sync time and service impairment.
- The Overview content, and every other console screen beyond its stub heading.
- Blueprints as a destination.
- A desktop collapsed rail, sidebar resizing, or a remembered open/closed state.
- Sidebar grouping (`SidebarSection`).
- Per-Site scope switching; the scope label is static.
- Deleting the boilerplate demo route.
- A dark theme.

## Further Notes

- **The guard moves, it does not change.** The redirect-with-return behaviour is the same rule
  the root route has today, relocated one level up. The end-to-end redirect tests are the proof
  that nothing regressed.
- **The drawer's in-memory-router unit tests are the one part most likely to need adjusting**
  during implementation; if they prove brittle, the drawer is still covered end to end and the
  unit layer can fall back to asserting the open/closed state alone.
- **Stub pages are deliberately empty.** Fake KPIs or tables in them would read as real data to
  an Administrator; a heading alone is the honest placeholder.
- **The sync clock is app-load time.** That is true as far as it goes, but the shell does not
  yet refresh anything; when a real sync exists, the same prop is fed from it and the label
  needs no change.
