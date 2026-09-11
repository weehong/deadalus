# ADR-0004: Subcontractors form one global Directory, not a per-Project list

## Status

Accepted, 2026-09-09.

## Decision

A Subcontractor is recorded once, in a Directory shared by every Project, and
its name is unique there (case-insensitive, trimmed). A Subcontractor's
involvement in a particular Project is expressed only through Assignments of
that Project's Items. No `projectId` lives on the Subcontractor table.

## Alternatives considered

- **Per-Project Subcontractors**, as the sibling `daedalus` repository does
  (`subcontractors.site_id not null`). Rejected: the same company works on
  several developments, and a per-Project row duplicates the company, its
  Members and their phone numbers, which must be globally unique for phone
  sign-in. It would also have blocked the Directory on a Project model that
  did not yet exist.
- **Global now, decide later.** Rejected: leaving the question open would
  have left the glossary's Project entry contradicting the navigation.

## Consequences

- The glossary's **Project** entry no longer says a Project "manages" its
  Subcontractors; **Directory** is a defined term.
- Reversing this means splitting Directory rows per Project and relaxing the
  phone uniqueness rule, so it should not be done casually.
- Nothing stops a later per-Project view of the Directory (the Subcontractors
  with Assignments in this Project); that is a query, not a change of
  ownership.
