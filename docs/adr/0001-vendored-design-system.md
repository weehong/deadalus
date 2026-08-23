# ADR-0001: Vendor the Industry design system stylesheet

## Decision

Vendor the stylesheet as the token and primitive source of truth and mirror only colour and type into Tailwind. Self-host the Latin fonts and append system CJK families.

## Alternatives considered

Porting the stylesheet wholesale to utilities was rejected because it would fork the design system immediately and make upstream changes difficult to reconcile. A remote font import was rejected for reliability, privacy, and offline operation.
