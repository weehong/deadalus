# ADR-0002: Supabase authentication with a session read model

## Decision

Use Supabase email/password authentication behind a small API boundary. Mirror its auth-state stream into Zustand; Supabase remains responsible for persistence while routes and components consume the synchronous read model.

## Alternatives considered

Reading the client directly in components was rejected because it couples UI and routing to the provider. A custom authentication service was rejected because it adds security-sensitive infrastructure without a product requirement. Keeping session state only in the provider was rejected because route pre-load guards need a synchronous value.
