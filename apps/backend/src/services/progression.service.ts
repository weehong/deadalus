import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { inProject, itemWhere, type ItemScope } from "@/services/item-scope.js";

/**
 * Roll-up reads: the Progression of a Unit, Storey, Block or Project is the
 * plain average of every Item beneath it, `null` when there are none. One
 * query module serves the Console's full Project read and, with the
 * Subcontractor scope, the Field's own Progression (ADR-0008, ADR-0003).
 */
export interface ItemRollup {
	readonly itemCount: number;
	readonly entryCount: number;
	readonly progression: number | null;
}
export interface UnitItemRow {
	readonly unitId: string;
	readonly catalogueItemId: string;
	readonly subcontractorId: string | null;
	readonly progression: number;
	readonly entryCount: number;
}

/** The plain average of Item Progressions; `null` for no Items. Not rounded. */
export function averageProgression(values: Array<number>): number | null {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function rollUp(rows: Array<UnitItemRow>): ItemRollup {
	return {
		itemCount: rows.length,
		entryCount: rows.reduce((sum, row) => sum + row.entryCount, 0),
		progression: averageProgression(rows.map((row) => row.progression)),
	};
}

/** What every roll-up read selects of an Item: the row plus its entry count. */
const unitItemRowSelect = {
	unitId: true,
	catalogueItemId: true,
	subcontractorId: true,
	progression: true,
	_count: { select: { entries: true } },
} satisfies Prisma.ItemSelect;
type UnitItemRowRecord = Prisma.ItemGetPayload<{
	select: typeof unitItemRowSelect;
}>;
const toUnitItemRow = ({ _count, ...row }: UnitItemRowRecord): UnitItemRow => ({
	...row,
	entryCount: _count.entries,
});

/**
 * One row per Item of the Project in scope: every Item for the Console's
 * read, one Subcontractor's for the Field's. Keyed by Unit so callers can
 * nest the roll-ups.
 */
export async function readUnitItemRows(
	projectId: string,
	scope: ItemScope = { projectId },
	database: Pick<Prisma.TransactionClient, "item"> = prisma
): Promise<Array<UnitItemRow>> {
	const items = await database.item.findMany({
		where: { ...inProject(projectId), ...itemWhere(scope) },
		select: unitItemRowSelect,
	});
	return items.map(toUnitItemRow);
}

/** The Items matching `where`, rolled up per Project they sit in. */
async function readRollupsByProject(
	where: Prisma.ItemWhereInput,
	database: Pick<Prisma.TransactionClient, "item">
): Promise<Map<string, ItemRollup>> {
	const items = await database.item.findMany({
		where,
		select: {
			...unitItemRowSelect,
			unit: {
				select: {
					storey: { select: { block: { select: { projectId: true } } } },
				},
			},
		},
	});
	const byProject = new Map<string, Array<UnitItemRow>>();
	for (const { unit, ...record } of items) {
		const { projectId } = unit.storey.block;
		const rows = byProject.get(projectId) ?? [];
		rows.push(toUnitItemRow(record));
		byProject.set(projectId, rows);
	}
	const rollups = new Map<string, ItemRollup>();
	for (const [projectId, rows] of byProject)
		rollups.set(projectId, rollUp(rows));
	return rollups;
}

/**
 * The Project-level roll-up of every listed Project in one query, keyed by
 * Project id, for the Projects list. A Project with no Items rolls up to
 * `null`; a Project outside the list is never read.
 */
export async function readProjectRollups(
	projectIds: Array<string>,
	database: Pick<Prisma.TransactionClient, "item"> = prisma
): Promise<Map<string, ItemRollup>> {
	const rollups = new Map<string, ItemRollup>(
		projectIds.map((projectId) => [projectId, rollUp([])])
	);
	if (projectIds.length === 0) return rollups;
	const held = await readRollupsByProject(
		{ unit: { storey: { block: { projectId: { in: projectIds } } } } },
		database
	);
	for (const [projectId, rollup] of held) rollups.set(projectId, rollup);
	return rollups;
}

/**
 * One Subcontractor's roll-up in every Project where it holds an Item, keyed
 * by Project id, for the Field's Projects list (ADR-0003: the filter is the
 * Member's own Subcontractor, never one named by the request). A Project
 * where it holds nothing has no entry.
 */
export async function readSubcontractorRollups(
	subcontractorId: string,
	database: Pick<Prisma.TransactionClient, "item"> = prisma
): Promise<Map<string, ItemRollup>> {
	return readRollupsByProject(itemWhere({ subcontractorId }), database);
}

/** The stored Structure as far as a fold needs it: ids, nested. */
export interface StructureRecord {
	readonly blocks: Array<{
		readonly id: string;
		readonly storeys: Array<{
			readonly id: string;
			readonly units: Array<{ readonly id: string }>;
		}>;
	}>;
}
/** The rows beneath a node, by its id; none for a node holding nothing. */
export interface RowsBeneath {
	readonly block: (id: string) => Array<UnitItemRow>;
	readonly storey: (id: string) => Array<UnitItemRow>;
	readonly unit: (id: string) => Array<UnitItemRow>;
}

/**
 * Index the Item rows beneath every Block, Storey and Unit of the Structure
 * in one walk, so a fold over it (the Console's full Project, the Field's
 * held-only view) reads each node's rows without walking again.
 */
export function rowsBeneath(
	structure: StructureRecord,
	rows: Array<UnitItemRow>
): RowsBeneath {
	const byUnit = new Map<string, Array<UnitItemRow>>();
	for (const row of rows) {
		const held = byUnit.get(row.unitId);
		if (held) held.push(row);
		else byUnit.set(row.unitId, [row]);
	}
	const byStorey = new Map<string, Array<UnitItemRow>>();
	const byBlock = new Map<string, Array<UnitItemRow>>();
	for (const block of structure.blocks) {
		const blockRows: Array<UnitItemRow> = [];
		for (const storey of block.storeys) {
			const storeyRows = storey.units.flatMap(
				(unit) => byUnit.get(unit.id) ?? []
			);
			byStorey.set(storey.id, storeyRows);
			blockRows.push(...storeyRows);
		}
		byBlock.set(block.id, blockRows);
	}
	const beneath =
		(index: Map<string, Array<UnitItemRow>>) =>
		(id: string): Array<UnitItemRow> =>
			index.get(id) ?? [];
	return {
		block: beneath(byBlock),
		storey: beneath(byStorey),
		unit: beneath(byUnit),
	};
}
