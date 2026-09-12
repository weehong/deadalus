import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { HttpError } from "@/lib/http-error.js";
import type {
	Project,
	UnitItemSummary,
} from "@/schemas/project-detail.schema.js";
import {
	readUnitItemRows,
	rollUp,
	rowsBeneath,
	type UnitItemRow,
} from "@/services/progression.service.js";
export const projectSelect = {
	id: true,
	name: true,
	code: true,
	blocks: {
		orderBy: [{ position: "asc" }, { id: "asc" }],
		select: {
			id: true,
			name: true,
			position: true,
			storeys: {
				orderBy: [{ position: "asc" }, { id: "asc" }],
				select: {
					id: true,
					name: true,
					position: true,
					units: {
						orderBy: [{ position: "asc" }, { id: "asc" }],
						select: { id: true, name: true, position: true, unitTypeId: true },
					},
				},
			},
		},
	},
	unitTypes: {
		orderBy: [{ codeKey: "asc" }, { id: "asc" }],
		select: {
			id: true,
			code: true,
			description: true,
			_count: { select: { units: true } },
		},
	},
	catalogueItems: {
		orderBy: [{ nameKey: "asc" }, { id: "asc" }],
		select: { id: true, name: true, _count: { select: { items: true } } },
	},
} satisfies Prisma.ProjectSelect;
/** The compact per-Unit Items summary the client previews selections from, ordered by Catalogue Item id. */
function summarise(rows: Array<UnitItemRow>): Array<UnitItemSummary> {
	return rows
		.map(({ catalogueItemId, subcontractorId, entryCount }) => ({
			catalogueItemId,
			subcontractorId,
			entryCount,
		}))
		.sort((a, b) => a.catalogueItemId.localeCompare(b.catalogueItemId));
}
/**
 * Shape the stored Project for the client, rolling the given Item rows up
 * into every Unit, Storey, Block and the Project (ADR-0008: the plain
 * average of the Items beneath a node, `null` where there are none). Each
 * Unit also carries a summary of its Items (Catalogue Item and Subcontractor
 * ids and the entry count) so a selection preview, and what a remove takes
 * with it, is exact; the Unit card's full Items read stays a separate route.
 */
export function toProject(
	record: Prisma.ProjectGetPayload<{ select: typeof projectSelect }>,
	itemRows: Array<UnitItemRow> = []
): Project {
	const beneath = rowsBeneath(record, itemRows);
	return {
		id: record.id,
		name: record.name,
		code: record.code,
		...rollUp(itemRows),
		blocks: record.blocks.map((block) => ({
			...block,
			...rollUp(beneath.block(block.id)),
			storeys: block.storeys.map((storey) => ({
				...storey,
				...rollUp(beneath.storey(storey.id)),
				units: storey.units.map((unit) => ({
					...unit,
					...rollUp(beneath.unit(unit.id)),
					items: summarise(beneath.unit(unit.id)),
				})),
			})),
		})),
		unitTypes: record.unitTypes.map(({ _count, ...unitType }) => ({
			...unitType,
			unitCount: _count.units,
		})),
		catalogueItems: record.catalogueItems.map(({ _count, ...item }) => ({
			...item,
			itemCount: _count.items,
		})),
	};
}
export async function readProject(
	id: string,
	database: Pick<Prisma.TransactionClient, "project" | "item"> = prisma
): Promise<Project> {
	const record = await database.project.findUnique({
		where: { id },
		select: projectSelect,
	});
	if (!record) throw HttpError.notFound("Project not found");
	return toProject(
		record,
		await readUnitItemRows(id, { projectId: id }, database)
	);
}
