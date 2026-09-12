import type { FakeEntry } from "./catalogue-items-api";

// What the browser-edge fakes share: the API contract's derived values,
// implemented once here rather than in each fake. Nothing in this file is
// a backend internal; each helper restates a rule the contract fixes.

/** The name key the API orders and de-duplicates by: trimmed, single-spaced, lower-cased. */
export const nameKey = (name: string): string =>
	name.trim().replace(/\s+/g, " ").toLowerCase();

/** When the fakes say an Assignment was made; fixtures carry no date of their own. */
export const ASSIGNED_AT = "2026-09-01T00:00:00.000Z";

/** The Directory's phone normalisation: separators dropped, `00` and bare local numbers made E.164 (+65 by default). */
export const normalizePhone = (input: string): string | null => {
	const compact = input.replace(/[\s\-()[\].]/g, "");
	const international = compact.startsWith("00")
		? `+${compact.slice(2)}`
		: compact;
	const phone = international.startsWith("+")
		? international
		: `+65${international}`;
	return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null;
};

/** The roll-up of a set of Items: counts and the plain average of their Progression, null with none. */
export const rollUp = (
	items: Array<{ progression: number; entryCount?: number }>
): { itemCount: number; entryCount: number; progression: number | null } => ({
	itemCount: items.length,
	entryCount: items.reduce((sum, item) => sum + (item.entryCount ?? 0), 0),
	progression: items.length
		? items.reduce((sum, item) => sum + item.progression, 0) / items.length
		: null,
});

/** Who an entry is snapshotted as: an Administrator, or a Member with its Subcontractor's name. */
export type EntryAuthor = Pick<
	FakeEntry,
	"enteredByKind" | "enteredByName" | "subcontractorName"
>;
let sequence = 0;
let lastCreatedAt = 0;
/** Ids and timestamps that strictly increase, so newest-first order is settled. */
export const nextEntry = (
	author: EntryAuthor,
	value: number,
	note: string | null
): FakeEntry => {
	sequence += 1;
	lastCreatedAt = Math.max(Date.now(), lastCreatedAt + 1);
	return {
		id: `entry-${String(sequence).padStart(6, "0")}`,
		value,
		note,
		...author,
		createdAt: new Date(lastCreatedAt).toISOString(),
	};
};
