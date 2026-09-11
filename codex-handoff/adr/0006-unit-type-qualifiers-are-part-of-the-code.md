# ADR-0006: A developer's qualifier is part of the Unit Type code, not an attribute of the Unit

## Status

Accepted, 2026-09-11.

## Decision

A Unit Type's code is the cell string exactly as the developer's Unit Matrix
spells it, qualifiers included: `BP2(p) (M)`, `C1 (d)`, `3D1a-PH`, `PH`. Each
distinct string is its own Unit Type. Daedalus does not parse a qualifier out
of a code and does not model PES, mirrored, top-storey or penthouse as
attributes of a Unit. Two spellings are the same code when they match after
upper-casing and removing all whitespace; the first spelling seen is kept for
display.

## Alternatives considered

- **A base code on the Unit Type and boolean flags on the Unit** (`pes`,
  `mirrored`, `topStorey`, `penthouse`). Rejected: every developer writes
  qualifiers differently (`(p)` glued or spaced, `(M)`, `(d)`, `-PH`, `PH`
  alone), so the parser would need a grammar per template and would silently
  misfile a spelling it had not seen. It also adds model concepts before any
  feature needs them.
- **Strip qualifiers and keep the base code.** Rejected: a PES unit and a
  mirrored unit take different fittings, which is the point of tracking
  Items per Unit.

## Consequences

- A large development's catalogue is long: about 80 Unit Types for a
  12-tower project whose schedule uses `(p)` and `(M)`. The Unit Types tab
  must stay usable at that size.
- The count "Units of type BP2" is a sum over several codes, not one row. A
  later grouping feature would derive it from a prefix rule, not from stored
  attributes.
- Reversing this means splitting existing codes into base codes and
  attributes with a data migration across every Unit and every Item hung
  off them, so it should not be done casually.
- The whitespace-insensitive code key applies to hand-entered codes as well
  as uploaded ones.
