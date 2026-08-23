# 01: Console layout route with session guard and stub destinations

**What to build:** A signed-in Administrator can reach every console destination by URL — Overview, Work orders, System status, Assets, Operators, Settings — and each one shows a page bearing its translated name. An Administrator without a Session who visits any of them is sent to sign in and returned to that exact destination afterwards. The guard lives once, on a pathless layout route wrapping all six screens, and the per-route guard on the console root is removed. The layout renders only a content region for now (no sidebar yet) so that the next ticket has somewhere to mount.

Overview keeps the existing placeholder page. The other five render a single heading carrying the destination label and nothing else. The boilerplate demo route stays outside the layout, untouched. Blueprints is not a destination.

Navigation labels are added to both locales (en-US, zh-CN — Chinese flagged for review) because the stub headings and the forthcoming sidebar share the same keys.

**Blocked by:** None (can start immediately)

**Status:** implemented (Playwright execution blocked by missing host browser libraries)

- [x] A pathless layout route wraps six child routes: the console root and five kebab-case paths named after their labels
- [x] The layout's pre-load hook redirects a visitor without a Session to sign-in with the intended path preserved; the root route no longer carries its own guard
- [x] Each stub page renders exactly one heading with the destination's translated label; Overview renders the existing placeholder page
- [x] Navigation label keys exist in en-US and zh-CN
- [ ] (written in `e2e/console.spec.ts`; not runnable here — Chromium lacks system libs `libnspr4`/`libnss3`/`libasound2`) End-to-end: for each of the six paths, a visitor without a Session is redirected to sign-in and lands back on that path after signing in (using the existing faked-session interception)
- [ ] End-to-end: a visitor with a Session reaches each path directly and sees its heading
- [x] Lint, typecheck, unit tests (incl. route-tree guard test) and build green; e2e suites pending local browser deps
