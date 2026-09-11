/** Directory identity ignores case and collapses runs of whitespace. */
export function subcontractorNameKey(name: string): string {
	return name.trim().replace(/\s+/g, " ").toLowerCase();
}
