import type { Prisma } from "@prisma/client";
import { HttpError } from "@/lib/http-error.js";
import { prisma } from "@/lib/prisma.js";
import type {
	FieldBlock,
	FieldProject,
	FieldProjectRow,
	FieldStorey,
	FieldUnit,
} from "@/schemas/field-projects.schema.js";
import {
	averageProgression,
	readSubcontractorRollups,
	readUnitItemRows,
	rowsBeneath,
	type UnitItemRow,
} from "@/services/progression.service.js";

/**
 * The Field's Project reads. Every read is scoped to one Subcontractor, the
 * one the Member behind the token belongs to (ADR-0003); nothing here takes
 * a Subcontractor id from a request. A Project, Block, Storey or Unit where
 * the Subcontractor holds no Item is not part of its Field at all: omitted
 * from lists, and a 404 rather than a 403 when addressed directly.
 */

/**
 * The Projects where the Subcontractor holds at least one Item, ordered by
 * name key then id, each with the Subcontractor's own count and Progression.
 */
export async function listFieldProjects(
	subcontractorId: string
): Promise<Array<FieldProjectRow>> {
	const rollups = await readSubcontractorRollups(subcontractorId);
	if (rollups.size === 0) return [];
	const records = await prisma.project.findMany({
		where: { id: { in: [...rollups.keys()] } },
		orderBy: [{ nameKey: "asc" }, { id: "asc" }],
		select: { id: true, code: true, name: true },
	});
	return records.flatMap((record) => {
		const rollup = rollups.get(record.id);
		// Every listed id came from the roll-ups, so the average is never null.
		if (!rollup || rollup.progression === null) return [];
		return [
			{
				...record,
				itemCount: rollup.itemCount,
				progression: rollup.progression,
			},
		];
	});
}

const fieldProjectSelect = {
	id: true,
	code: true,
	name: true,
	blocks: {
		orderBy: [{ position: "asc" }, { id: "asc" }],
		select: {
			id: true,
			name: true,
			storeys: {
				orderBy: [{ position: "asc" }, { id: "asc" }],
				select: {
					id: true,
					name: true,
					units: {
						orderBy: [{ position: "asc" }, { id: "asc" }],
						select: { id: true, name: true },
					},
				},
			},
		},
	},
} satisfies Prisma.ProjectSelect;

type FieldProjectRecord = Prisma.ProjectGetPayload<{
	select: typeof fieldProjectSelect;
}>;

/** The roll-up of a non-empty set of rows; the Field never shows an empty node. */
function rollUpHeld(rows: Array<UnitItemRow>): {
	itemCount: number;
	progression: number;
} {
	return {
		itemCount: rows.length,
		progression: averageProgression(rows.map((row) => row.progression)) ?? 0,
	};
}

/**
 * Fold the Subcontractor's Item rows into the stored Structure, keeping
 * Structure order and dropping every node beneath which it holds nothing.
 * Returns null when it holds nothing in the whole Project.
 */
export function toFieldProject(
	record: FieldProjectRecord,
	rows: Array<UnitItemRow>
): FieldProject | null {
	if (rows.length === 0) return null;
	const beneath = rowsBeneath(record, rows);
	const blocks = record.blocks.flatMap((block): Array<FieldBlock> => {
		const storeys = block.storeys.flatMap((storey): Array<FieldStorey> => {
			const units = storey.units.flatMap((unit): Array<FieldUnit> => {
				const held = beneath.unit(unit.id);
				return held.length > 0
					? [{ id: unit.id, name: unit.name, ...rollUpHeld(held) }]
					: [];
			});
			const held = beneath.storey(storey.id);
			return units.length > 0
				? [{ id: storey.id, name: storey.name, ...rollUpHeld(held), units }]
				: [];
		});
		const held = beneath.block(block.id);
		return storeys.length > 0
			? [{ id: block.id, name: block.name, ...rollUpHeld(held), storeys }]
			: [];
	});
	return {
		id: record.id,
		code: record.code,
		name: record.name,
		...rollUpHeld(rows),
		blocks,
	};
}

/**
 * One Project as the Subcontractor's Members see it. An unknown Project and
 * one where the Subcontractor holds nothing are the same 404, so nothing
 * about other companies' work is revealed.
 */
export async function readFieldProject(
	id: string,
	subcontractorId: string
): Promise<FieldProject> {
	const [record, rows] = await Promise.all([
		prisma.project.findUnique({ where: { id }, select: fieldProjectSelect }),
		readUnitItemRows(id, { subcontractorId }),
	]);
	const project = record ? toFieldProject(record, rows) : null;
	if (!project) throw HttpError.notFound("Project not found");
	return project;
}
