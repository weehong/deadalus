/** A Progress entry's moment in the reader's language: medium date, short time. */
export const formatDateTime = (iso: string, locale: string): string =>
	new Date(iso).toLocaleString(locale, {
		dateStyle: "medium",
		timeStyle: "short",
	});
