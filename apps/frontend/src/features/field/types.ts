import type { UnitItem } from "@/common/items";

/** The Member behind a Field Session, with the Subcontractor they belong to. */
export interface FieldMember {
	id: string;
	name: string;
	subcontractor: { id: string; name: string };
}

/** What sign-in hands back: the Member token and the Member it names. */
export interface MemberSession {
	token: string;
	member: FieldMember;
}

/**
 * The Subcontractor's own roll-up within one node. Never null: a node where
 * it holds no Item is not part of the Field at all.
 */
export interface FieldRollup {
	itemCount: number;
	progression: number;
}

/** One Project on the Field's list: the Subcontractor holds at least one Item in it. */
export interface FieldProjectRow extends FieldRollup {
	id: string;
	code: string;
	name: string;
}

export interface FieldUnit extends FieldRollup {
	id: string;
	name: string;
}
export interface FieldStorey extends FieldRollup {
	id: string;
	name: string;
	units: Array<FieldUnit>;
}
export interface FieldBlock extends FieldRollup {
	id: string;
	name: string;
	storeys: Array<FieldStorey>;
}

/** A Project as the Field walks it: only the nodes where the Subcontractor holds Items, in Structure order. */
export interface FieldProject extends FieldRollup {
	id: string;
	code: string;
	name: string;
	blocks: Array<FieldBlock>;
}

/**
 * A Unit as the Field's Unit screen reads it: the heading (its Project,
 * Block and Storey, and the Unit itself) and the Subcontractor's Items
 * there in the Console's Item shape, ordered by name key. Never empty: a
 * Unit where the Subcontractor holds nothing is a 404.
 */
export interface FieldUnitItems {
	project: { id: string; code: string; name: string };
	block: { id: string; name: string };
	storey: { id: string; name: string };
	unit: { id: string; name: string };
	items: Array<UnitItem>;
}

/** The node being looked at on the drill-down: a Block selects its Storeys, a Storey its Units. */
export interface FieldProjectSearch {
	block?: string;
	storey?: string;
}
