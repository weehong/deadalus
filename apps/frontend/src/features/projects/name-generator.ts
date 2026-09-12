export type NameInput =
	| {
			mode: "range";
			prefix: string;
			from: number;
			to: number;
			pad: number;
			suffix: string;
	  }
	| { mode: "list"; text: string };
export const nameKey = (name: string): string =>
	name.trim().replace(/\s+/g, " ").toLowerCase();
export function generateNames(input: NameInput): Array<string> {
	if (input.mode === "list")
		return input.text
			.split(/\r?\n/)
			.map((line) => line.trim())
			.filter(Boolean);
	const { from, to, pad, prefix, suffix } = input;
	if (
		!Number.isSafeInteger(from) ||
		!Number.isSafeInteger(to) ||
		from < 0 ||
		to < from ||
		to - from >= 500 ||
		!Number.isInteger(pad) ||
		pad < 0 ||
		pad > 60
	)
		return [];
	return Array.from({ length: to - from + 1 }, (_, index) =>
		`${prefix}${String(from + index).padStart(pad, "0")}${suffix}`.trim()
	);
}
export function previewNames(
	names: Array<string>,
	existingNames: Array<string>
): Array<{ name: string; existing: boolean; repeated: boolean }> {
	const existing = new Set(existingNames.map(nameKey));
	const counts = new Map<string, number>();
	for (const name of names)
		counts.set(nameKey(name), (counts.get(nameKey(name)) ?? 0) + 1);
	return names.map((name) => ({
		name,
		existing: existing.has(nameKey(name)),
		repeated: (counts.get(nameKey(name)) ?? 0) > 1,
	}));
}
