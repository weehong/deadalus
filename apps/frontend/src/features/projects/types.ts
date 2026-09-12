/** Counts and the plain-average Progression of the Items beneath a node; `null` with no Items. */
export interface ItemRollup {
	itemCount: number;
	entryCount: number;
	progression: number | null;
}
/** One Item of a Unit by ids only; names and entries come from the Unit's Items read. */
export interface UnitItemSummary {
	catalogueItemId: string;
	/** The Item's Assignment; null when it has none. */
	subcontractorId: string | null;
	/** How many Progress entries the Item holds, so a remove can say exactly what goes with it. */
	entryCount: number;
}
export interface Unit extends ItemRollup {
	id: string;
	name: string;
	position: number;
	unitTypeId: string | null;
	/** Ordered by Catalogue Item id, so a selection preview is exact. */
	items: Array<UnitItemSummary>;
}
export interface Storey extends ItemRollup {
	id: string;
	name: string;
	position: number;
	units: Array<Unit>;
}
export interface Block extends ItemRollup {
	id: string;
	name: string;
	position: number;
	storeys: Array<Storey>;
}
export interface UnitType {
	id: string;
	code: string;
	description: string | null;
	unitCount: number;
}
export interface CatalogueItem {
	id: string;
	name: string;
	/** How many Units hold an Item made from this Catalogue Item. */
	itemCount: number;
}
export interface Project extends ItemRollup {
	id: string;
	name: string;
	code: string;
	blocks: Array<Block>;
	unitTypes: Array<UnitType>;
	catalogueItems: Array<CatalogueItem>;
}
