# ADR-0008: Items are per-Unit copies made from a per-Project Item Catalogue

## Status

Accepted, 2026-09-12.

## Decision

Each Project has an Item Catalogue: a list of Catalogue Items, each a name
unique within the Project by name key. An Administrator applies a Catalogue
Item to a chosen set of Units (a Block, some Storeys, some Unit Types, or all
of them) and one Item is created in every selected Unit that does not already
hold one made from that Catalogue Item. Each Item holds its own Assignment and
its own Progress entries. Renaming a Catalogue Item renames every Item made
from it; deleting a Catalogue Item is refused with the count while any Unit
still holds one. Removing Items from Units is a separate, confirmed action
that takes their Progress entries with them.

## Alternatives considered

- **Items typed directly on each Unit, with an Add many across Storeys.**
  Rejected: a Project has a thousand or more Units, and without a shared
  name there is nothing to rename in one place, nothing to assign in bulk
  and nothing for a later report to group by.
- **A template on the Unit Type, inherited by its Units.** Rejected: a
  one-off Item on one Unit, or an Item that only some Units of a type get,
  has nowhere to go; and a Unit with no Unit Type would have no Items.
- **The Subcontractor set once on the Catalogue Item.** Rejected: the same
  Item in two Blocks routinely goes to two companies, so Assignment belongs
  on the per-Unit Item and is made in bulk over a selection instead.

## Consequences

- Assignment and Progression live on the Item, never on the Catalogue Item;
  a Catalogue Item is a name and nothing else.
- Every roll-up is the plain average of the Items beneath a Unit, Storey,
  Block or Project; the Catalogue plays no part in it.
- Reversing this means either collapsing thousands of Items into a shared
  row, losing per-Unit Assignments and histories, or detaching them from
  the catalogue and losing bulk rename; so it should not be done casually.
