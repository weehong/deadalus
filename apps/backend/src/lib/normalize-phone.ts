/** The sole default country code. Return null when the result cannot be E.164. */
export function normalizePhone(input: string): string | null {
	const compact = input.replace(/[\s\-()[\].]/g, "");
	const international = compact.startsWith("00")
		? `+${compact.slice(2)}`
		: compact;
	const phone = international.startsWith("+")
		? international
		: `+65${international}`;
	return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
}
