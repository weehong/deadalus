# ADR-0003: Single tenant, with Members scoped to their own Subcontractor

## Status

Accepted, 2026-09-09.

## Decision

Daedalus serves one contractor organisation. There is no organisation or
tenant record, no tenant claim on the access token, and no tenant column on
any table. Every Administrator with a Session may read and change every
Subcontractor, Member, Project and Item.

Object-level authorisation is therefore defined by role, not by ownership:

- An **Administrator** reaches any object by its id, and every route that
  exposes one sits behind the verified-token check.
- A **Member**, once phone sign-in exists, is bound to exactly one
  Subcontractor. Any request a Member makes is resolved through that
  Subcontractor, taken from the Member's own identity, never from an id the
  client supplies. A Member cannot name another Subcontractor's Items or
  progress records, and the API never trusts a `subcontractorId` in a
  Member's request body or path.

To keep that rule easy to honour, Members are reached only through their
Subcontractor's routes (`/subcontractors/:id/members/...`); there is no
top-level Member resource.

## Alternatives considered

- **Multi-tenant from the first table.** Rejected: it needs an Organisation
  concept, a claim minted into the token, and a scope on every query, for a
  product with one customer. It can be added later; adding it later touches
  every table and query, which is why this decision is recorded.
- **Treating "authenticate every route" as sufficient.** Rejected: it says
  nothing about the Member flow, which is where a client-supplied id would
  reach another company's data.

## Consequences

- The first feature that lets a Member act must derive the Member's
  Subcontractor from the token and refuse any object outside it. That is the
  "no BOLA violation" requirement stated when the Subcontractor slice was
  designed.
- If a second contractor organisation ever shares one deployment, this ADR is
  superseded and a tenant scope is added to every table and query.
