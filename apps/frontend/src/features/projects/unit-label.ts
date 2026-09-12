/**
 * A Unit's full label, composed from its Storey and its own name for display
 * exactly as the glossary composes it: #12-01, #G-05, #12-114. Display only;
 * never parsed back apart.
 */
export const unitLabel = (storeyName: string, unitName: string): string =>
	`#${storeyName}-${unitName}`;
