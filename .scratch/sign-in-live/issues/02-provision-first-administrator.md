# 02: Provision the first Administrator and close public sign-up

**What to build:** One real Administrator exists and nobody else can make themselves one.

An Administrator account is created by hand in the provider's dashboard for the project
owner's address, marked confirmed at creation so the known "unconfirmed email shows the
generic message" degradation never bites. Its password lives only in the owner's credential
store — never in chat, the repository, or a scratch file that outlives the session. Then
public sign-up is switched off, so a provisioned account is the only way into the console,
matching the spec and the glossary's definition of Provisioning.

This ticket is dashboard work; no agent can reach it. It is here so the dependency is
visible and so ticket 03 has something real to verify against.

**Blocked by:** None (can start immediately)

**Status:** needs-human

- [ ] An Administrator account exists for the owner's address and is email-confirmed.
- [ ] Its password is in the owner's credential store under a known path and nowhere else.
- [ ] Public sign-up is disabled; the provider's public settings endpoint reports it closed.
- [ ] Email confirmation remains required for any future account, so provisioning must keep
      creating accounts pre-confirmed.
