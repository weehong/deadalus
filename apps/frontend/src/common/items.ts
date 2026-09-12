/**
 * An Item and its Progress entries as the Console's Unit card and the
 * Field's Unit screen both read them; the API answers both with this shape.
 */

/** The latest Progress entry of an Item, as a row summarises it. */
export interface LatestEntry {
	value: number;
	note: string | null;
	/** The Administrator's email or the Member's name, as snapshotted. */
	enteredByName: string;
	createdAt: string;
}

/** One Item of a Unit; ordered by name key. */
export interface UnitItem {
	id: string;
	catalogueItemId: string;
	/** The Catalogue Item's name; Items carry none of their own. */
	name: string;
	/** The Item's Assignment; null when it has none. */
	subcontractor: { id: string; name: string } | null;
	assignedAt: string | null;
	progression: number;
	/** The Item's latest entry; null when it has none. */
	latestEntry: LatestEntry | null;
}

/** One entry of an Item's history: the value, who entered it and when. Never changed once made. */
export interface ProgressEntry {
	id: string;
	value: number;
	note: string | null;
	enteredByKind: "administrator" | "member";
	/** The Administrator's email or the Member's name, as snapshotted. */
	enteredByName: string;
	/** The Member's Subcontractor at the time; null for an Administrator's entry. */
	subcontractorName: string | null;
	createdAt: string;
}

/** A Progress entry as entered: a whole number from 0 to 100 and an optional note. */
export interface ProgressEntryInput {
	value: number;
	note?: string;
}
