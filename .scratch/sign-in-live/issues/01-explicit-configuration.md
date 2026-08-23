# 01: Sign-in configuration is explicit and out of version control

**What to build:** A developer cloning Daedalus Ops knows exactly how to point it at a
provider, and a developer who forgets is told so immediately rather than being shown a
sign-in screen that silently rejects every Administrator.

The real environment file stops being versioned; the example file is the template and the
readme's setup says to copy it. When the provider URL or publishable key is absent, the
application refuses to start with a message that names the two variables and the example
file — except under the unit-test runner and stories, which never reach the provider and keep
running on placeholders. The glossary gains **Session** and **Provisioning** so the concepts
the guards and the spec already rely on have names.

The provider's publishable key was committed once before this ticket; it is public by design
and needs no rotation. This ticket stops it recurring, it does not rewrite history.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] The real environment file is untracked and ignored; the example file remains tracked
      with placeholder values.
- [ ] The readme's setup steps tell a new developer to copy the example file before running.
- [ ] With either provider variable missing, `dev`, `preview` and `build` output fail at
      startup with a message naming both variables and the example file.
- [ ] Unit tests and Storybook run with no environment file present.
- [ ] The glossary defines Session and Provisioning without naming the provider.
- [ ] Lint, type-check, unit tests and the intercepted end-to-end suite all pass.
