# ADR-0003: Data access through per-entity Supabase modules and query hooks

## Decision

Read and write application data (Sites, Storeys, Floor plans, Units, Installations,
Subcontractors, Scope assignments, Drawings) through the existing Supabase client, confined to
one small data module per entity, each exposing typed list/read/create/update/delete
functions. Screens reach those modules only through TanStack Query hooks keyed by Site and
entity, with mutations invalidating the keys they affect. Components receive data and
callbacks as props and never import the client. Schema, constraints, row-level security and
storage policies live in versioned migrations; a dev-only seed is kept beside them.

## Alternatives considered

A repository interface with an in-memory implementation was rejected: it would be a second
prototype, and the project already committed to Supabase for authentication (ADR-0002).
A bespoke API server in front of the database was rejected as infrastructure without a
product requirement; row-level security covers the access rule in force (any signed-in
Administrator). Calling the client directly from components was rejected because it couples
UI to the provider and defeats testing components by props.
