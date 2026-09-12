/**
 * The absolute URL of a Unit's Field screen: what a QR label carries and
 * nothing else (ADR-0010). The origin is the printing browser's own, so
 * labels printed from a development origin point at that origin.
 */
export const fieldUnitUrl = (origin: string, unitId: string): string =>
	`${origin}/field/units/${unitId}`;
