/** Initials from the first two words, or the first two letters of one word. */
export const initialsFor = (email: string): string => {
	const local = email.split("@")[0] ?? "";
	const words = local.split(/[^a-z0-9]+/i).filter(Boolean);
	const initials =
		words.length >= 2
			? `${words[0]?.[0] ?? ""}${words[1]?.[0] ?? ""}`
			: (words[0]?.slice(0, 2) ?? "");
	return initials.toUpperCase();
};
