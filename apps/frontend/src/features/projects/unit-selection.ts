import type { Project, Unit } from "@/features/projects/types";

/**
 * The Unit selection shared by apply, remove and bulk assign, computed
 * client-side from the loaded Project so a dialog can say what one click
 * does before the API, the authority, answers.
 */

/** What the `UnitSelection` component edits: one Block or every Block, then explicit lists. */
export interface UnitSelectionValue {
	blockId: string | null;
	storeyIds: Array<string>;
	unitTypeIds: Array<string>;
}
/** The API's shape: each filter a non-empty list when given; none selects every Unit. */
export interface UnitSelectionBody {
	blockIds?: Array<string>;
	storeyIds?: Array<string>;
	unitTypeIds?: Array<string>;
}
export interface SelectableStorey {
	id: string;
	name: string;
	blockName: string;
}

/** The Storeys the chosen Block offers; every Block's, each named by its Block, when none is chosen. */
export const storeysOf = (
	project: Project,
	blockId: string | null
): Array<SelectableStorey> =>
	project.blocks
		.filter((block) => blockId === null || block.id === blockId)
		.flatMap((block) =>
			block.storeys.map((storey) => ({
				id: storey.id,
				name: storey.name,
				blockName: block.name,
			}))
		);

/** Everything in the Block's scope selected, the default of every dialog. */
export const selectAll = (
	project: Project,
	blockId: string | null
): UnitSelectionValue => ({
	blockId,
	storeyIds: storeysOf(project, blockId).map((storey) => storey.id),
	unitTypeIds: project.unitTypes.map((type) => type.id),
});

/** The request body: a list travels only when it narrows its scope. */
export const toUnitSelectionBody = (
	project: Project,
	value: UnitSelectionValue
): UnitSelectionBody => {
	const storeys = storeysOf(project, value.blockId);
	const everyStorey = storeys.every((storey) =>
		value.storeyIds.includes(storey.id)
	);
	const everyType = project.unitTypes.every((type) =>
		value.unitTypeIds.includes(type.id)
	);
	return {
		...(value.blockId === null ? {} : { blockIds: [value.blockId] }),
		...(everyStorey ? {} : { storeyIds: value.storeyIds }),
		...(everyType ? {} : { unitTypeIds: value.unitTypeIds }),
	};
};

/** The API refuses a filter given as an empty list. */
export const isValidSelection = (body: UnitSelectionBody): boolean =>
	[body.blockIds, body.storeyIds, body.unitTypeIds].every(
		(ids) => ids === undefined || ids.length > 0
	);

/** The Units the API would select: every filter given must match; none selects every Unit. */
export const selectUnits = (
	project: Project,
	body: UnitSelectionBody
): Array<Unit> => {
	const blocks = body.blockIds && new Set(body.blockIds);
	const storeys = body.storeyIds && new Set(body.storeyIds);
	const types = body.unitTypeIds && new Set(body.unitTypeIds);
	return project.blocks
		.filter((block) => !blocks || blocks.has(block.id))
		.flatMap((block) => block.storeys)
		.filter((storey) => !storeys || storeys.has(storey.id))
		.flatMap((storey) => storey.units)
		.filter(
			(unit) =>
				!types || (unit.unitTypeId !== null && types.has(unit.unitTypeId))
		);
};

/** How many of the selected Units already hold an Item made from the Catalogue Item. */
export const holdingCount = (
	selected: Array<Unit>,
	catalogueItemId: string
): number =>
	selected.filter((unit) =>
		unit.items.some((item) => item.catalogueItemId === catalogueItemId)
	).length;

/** What removing a Catalogue Item from the selected Units takes with it: exact, from the loaded Project. */
export interface RemovalCounts {
	/** One Item per selected Unit holding the Catalogue Item. */
	items: number;
	/** The Progress entries of those Items. */
	entries: number;
}
export const removalCounts = (
	selected: Array<Unit>,
	catalogueItemId: string
): RemovalCounts => {
	const going = selected.flatMap((unit) =>
		unit.items.filter((item) => item.catalogueItemId === catalogueItemId)
	);
	return {
		items: going.length,
		entries: going.reduce((sum, item) => sum + item.entryCount, 0),
	};
};
