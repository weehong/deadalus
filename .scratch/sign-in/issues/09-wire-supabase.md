# 09: Wire sign-in to Supabase

**What to build:** Real credentials sign an Administrator in, and real failures produce the
right message.

Supabase becomes the authentication provider, using email-and-password sign-in. Its client is
created in exactly one module, configured from two environment variables — the project URL and
the publishable anonymous key — declared in the example environment file and in the environment
type declarations. The service-role key must never enter this codebase.

A thin authentication module wraps sign-in and is the only caller of the client. Session state
is mirrored into the project's store layer: one subscription to the provider's auth-state
stream writes the session into a store, so no component ever imports the provider. The provider
remains the persistence mechanism; the store is a read model.

Provider errors are normalised by a **pure mapping function** into a small closed set. This
shape came out of the design discussion and is the decision, not an illustration:

```
InvalidCredentials  ← any 400-class credential rejection, including "email not confirmed"
RateLimited         ← 429
Unavailable         ← network failure or 5xx
Unknown             ← anything else
```

`InvalidCredentials` deliberately collapses distinguishable provider messages into one
user-facing message, so the screen cannot be used to discover which email addresses have
accounts. `RateLimited` and `Unavailable` stay distinct because an Administrator can act on
them: wait, or check the network. Note the known cost: an Administrator whose email is genuinely
unconfirmed gets an unhelpful message. That is accepted because accounts are provisioned rather
than self-signed-up.

This ticket replaces the temporary stub from ticket 08 and carries ADR-0002, recording the
choice of provider and the decision to mirror the session rather than read the provider
directly.

**Note:** the Supabase project may not exist yet. Build against the environment placeholders;
the mapping function, the store and the form remain fully verifiable without live credentials.

**Blocked by:** 08

**Status:** ready-for-agent

- [ ] Submitting credentials calls the provider's email-and-password sign-in.
- [ ] A successful sign-in results in a session recorded in the store.
- [ ] A credential rejection shows one generic message that does not reveal whether the account
      exists.
- [ ] An unconfirmed-email rejection shows that same generic message.
- [ ] A rate-limited response shows a distinct message telling the Administrator to wait.
- [ ] A network failure or server error shows a distinct message about the service being
      unreachable.
- [ ] The error mapping is a pure function, tested directly against a table of provider errors.
- [ ] Only one module constructs the provider client; no component imports the provider.
- [ ] The environment variables are declared in the example environment file and in the
      environment type declarations, and the service-role key appears nowhere.
- [ ] The temporary stub from ticket 08 is gone.
- [ ] ADR-0002 exists, states the alternatives considered, and gives the reasons.
- [ ] Lint, type-check, unit tests and the existing end-to-end suite all pass.
