# 03: A real Administrator signs in against the live provider

**What to build:** Proof that the sign-in flow works for real, not only against intercepted
responses.

Run the authentication module against the live project with the provisioned Administrator's
credentials supplied through the environment (read from the credential store, never typed
into a file in the repository). The check shows that a wrong password and an unknown account
both collapse to the single generic failure, that the real credentials yield a Session whose
email is the Administrator's and whose account is confirmed, that the auth-state stream
delivers that Session to the read model, and that the provider's public settings report
sign-up closed.

The check is opt-in and credential-gated; it is not added to the default unit or end-to-end
suites, which stay provider-free as the spec intends. Once it passes, the spec's "Further
Notes" stop saying the provider does not exist and the environment is unset, and record that
a browser-level pass is still owed if ticket 04 was not done.

**Blocked by:** 01 (explicit configuration), 02 (provision first Administrator)

**Status:** ready-for-agent

- [ ] A wrong password for the Administrator maps to the generic invalid-credentials failure.
- [ ] An unknown account maps to the same failure, indistinguishable from the wrong password.
- [ ] The Administrator's real credentials return a Session for that email with a confirmed
      account, and the auth-state stream reports it.
- [ ] The provider's public settings report sign-up disabled.
- [ ] The credentials reach the check only via the environment from the credential store.
- [ ] Nothing credential-bearing or provider-dependent is added to the default test suites.
- [ ] The spec's further notes reflect that the provider project now exists and is wired.
