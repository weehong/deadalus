import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { HttpError } from "@/lib/http-error.js";
import type { UnitItem } from "@/schemas/unit-items.schema.js";
import { itemWhere, type ItemScope } from "@/services/item-scope.js";

const unitItemSelect = {
	id: true,
	catalogueItemId: true,
	assignedAt: true,
	progression: true,
	catalogueItem: { select: { name: true } },
	subcontractor: { select: { id: true, name: true } },
	// The latest entry by createdAt then id: the one the Progression mirrors.
	entries: {
		orderBy: [{ createdAt: "desc" }, { id: "desc" }],
		take: 1,
		select: {
			value: true,
			note: true,
			enteredByName: true,
			createdAt: true,
		},
	},
} satisfies Prisma.ItemSelect;

type UnitItemRecord = Prisma.ItemGetPayload<{ select: typeof unitItemSelect }>;

const toUnitItem = (item: UnitItemRecord): UnitItem => {
	const latest = item.entries[0];
	return {
		id: item.id,
		catalogueItemId: item.catalogueItemId,
		name: item.catalogueItem.name,
		subcontractor: item.subcontractor,
		assignedAt: item.assignedAt?.toISOString() ?? null,
		progression: item.progression,
		latestEntry: latest
			? {
					value: latest.value,
					note: latest.note,
					enteredByName: latest.enteredByName,
					createdAt: latest.createdAt.toISOString(),
				}
			: null,
	};
};

/**
 * The Items of one Unit in the shape both the Unit card and the Field read:
 * each with its Catalogue Item's name, its Assignment, its stored
 * Progression and its latest Progress entry, ordered by name key. The scope
 * narrows the read: the Console's to the Project, the Field's to the
 * Member's Subcontractor (ADR-0003).
 */
export async function readItems(
	scope: ItemScope,
	unitId: string,
	database: Pick<Prisma.TransactionClient, "item"> = prisma
): Promise<Array<UnitItem>> {
	const items = await database.item.findMany({
		where: { unitId, ...itemWhere(scope) },
		orderBy: [{ catalogueItem: { nameKey: "asc" } }, { id: "asc" }],
		select: unitItemSelect,
	});
	return items.map(toUnitItem);
}

/**
 * The Unit card's Items read. The Unit is resolved through the Project in
 * the path, so a Unit of another Project is a 404 (ADR-0003).
 */
export async function readUnitItems(
	projectId: string,
	unitId: string,
	database: Pick<Prisma.TransactionClient, "unit" | "item"> = prisma
): Promise<Array<UnitItem>> {
	if (
		!(await database.unit.findFirst({
			where: { id: unitId, storey: { block: { projectId } } },
			select: { id: true },
		}))
	)
		throw HttpError.notFound("Unit not found");
	return readItems({ projectId }, unitId, database);
}
