# ADR-0005: Unit Types are a per-Project catalogue, not a global one

## Status

Accepted, 2026-09-11.

## Decision

A Unit Type (code such as AS1, description such as 1 Bedroom + Study) belongs
to one Project. Its code is unique within that Project only. A Unit may
reference one Unit Type of its own Project, or none. Deleting a Unit Type that
Units still reference is refused; deleting a Project removes its Unit Types.

## Alternatives considered

- **One global catalogue shared by every Project.** Rejected: the codes on a
  developer's unit schedule (AS1, BP2(p), CP7(Showflat)) are chosen per
  development and collide across developments with different meanings. A
  global list would force renaming on import and would let one Project's
  edit silently change another's labels.
- **A free-text type label on each Unit.** Rejected: 1193 Units carrying the
  same string cannot be renamed in one place, and a later upload would have
  nothing to validate a row's type against.

## Consequences

- The same description ("2 Bedroom Premium") is entered again in every
  Project that has it. That repetition is accepted; a later "copy Unit Types
  from another Project" action is a query and a bulk create, not a model
  change.
- Reversing this means merging catalogues and resolving code collisions
  across Projects, so it should not be done casually.
- A Unit's Unit Type reference is validated against the same Project on every
  write; a Unit Type of another Project is a 404, never a hit.
