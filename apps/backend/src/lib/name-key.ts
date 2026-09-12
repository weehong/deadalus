/** Identity ignores case and collapses runs of whitespace. */
export function nameKey(name: string): string {
	return name.trim().replace(/\s+/g, " ").toLowerCase();
}
/** Unit Type identity retains qualifiers but ignores every whitespace character. */
export function unitTypeCodeKey(code: string): string {
	return code.replace(/\s/g, "").toUpperCase();
}
