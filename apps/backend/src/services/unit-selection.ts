/**
 * The Unit selection shared by apply, remove and bulk assign: a Unit is
 * selected when it matches every filter given; no filters selects every
 * Unit of the Project. Pure, so the same rule is testable outside the seam.
 */
export interface UnitSelection {
	readonly blockIds?: Array<string>;
	readonly storeyIds?: Array<string>;
	readonly unitTypeIds?: Array<string>;
}
export interface SelectableUnit {
	readonly id: string;
	readonly blockId: string;
	readonly storeyId: string;
	readonly unitTypeId: string | null;
}

export function selectUnits<T extends SelectableUnit>(
	units: Array<T>,
	selection: UnitSelection
): Array<T> {
	const blocks = selection.blockIds && new Set(selection.blockIds);
	const storeys = selection.storeyIds && new Set(selection.storeyIds);
	const unitTypes = selection.unitTypeIds && new Set(selection.unitTypeIds);
	return units.filter(
		(unit) =>
			(!blocks || blocks.has(unit.blockId)) &&
			(!storeys || storeys.has(unit.storeyId)) &&
			(!unitTypes ||
				(unit.unitTypeId !== null && unitTypes.has(unit.unitTypeId)))
	);
}
