import { fieldUnitUrl } from "@/features/field/field-unit-url";
import { unitLabel } from "@/features/projects/unit-label";

/** All a label run needs of a Project: its Structure's names, ids and positions. */
export interface LabelledProject {
	blocks: Array<{
		id: string;
		name: string;
		position: number;
		storeys: Array<{
			name: string;
			position: number;
			units: Array<{ id: string; name: string; position: number }>;
		}>;
	}>;
}

/** One Unit's label: what its code carries and what it reads. */
export interface QrLabelUnit {
	unitId: string;
	url: string;
	label: string;
}

/** One Block's labels, in the order they are printed. */
export interface QrLabelBlock {
	id: string;
	name: string;
	units: Array<QrLabelUnit>;
}

const byPosition = <T extends { position: number }>(
	items: Array<T>
): Array<T> => [...items].sort((a, b) => a.position - b.position);

/**
 * The labels a print run covers: every Block of the Project in Structure
 * order, or the one Block asked for, each carrying its Units in Storey order
 * (lowest first) then Unit order. A Block with no Units is kept, so the page
 * can say so rather than printing a blank sheet.
 */
export const qrLabelBlocks = (
	project: LabelledProject,
	origin: string,
	blockId?: string
): Array<QrLabelBlock> =>
	byPosition(project.blocks)
		.filter((block) => blockId === undefined || block.id === blockId)
		.map((block) => ({
			id: block.id,
			name: block.name,
			units: byPosition(block.storeys).flatMap((storey) =>
				byPosition(storey.units).map((unit) => ({
					unitId: unit.id,
					url: fieldUnitUrl(origin, unit.id),
					label: unitLabel(storey.name, unit.name),
				}))
			),
		}));
