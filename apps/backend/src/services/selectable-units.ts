import type { Prisma } from "@prisma/client";
import { HttpError } from "@/lib/http-error.js";
import type { SelectableUnit, UnitSelection } from "@/services/unit-selection.js";

/**
 * Every Unit of the Project in Structure order, with the selection's ids
 * resolved against the Project first, so a Block, Storey or Unit Type of
 * another Project is a 404 before any write. Shared by apply, remove and
 * bulk assign.
 */
export async function readSelectableUnits(
	projectId: string,
	selection: UnitSelection,
	tx: Pick<Prisma.TransactionClient, "block" | "unitType">
): Promise<Array<SelectableUnit>> {
	const blocks = await tx.block.findMany({
		where: { projectId },
		orderBy: [{ position: "asc" }, { id: "asc" }],
		select: {
			id: true,
			storeys: {
				orderBy: [{ position: "asc" }, { id: "asc" }],
				select: {
					id: true,
					units: {
						orderBy: [{ position: "asc" }, { id: "asc" }],
						select: { id: true, unitTypeId: true },
					},
				},
			},
		},
	});
	const unitTypes = await tx.unitType.findMany({
		where: { projectId },
		select: { id: true },
	});
	const known = {
		blockIds: new Set(blocks.map((block) => block.id)),
		storeyIds: new Set(
			blocks.flatMap((block) => block.storeys).map((storey) => storey.id)
		),
		unitTypeIds: new Set(unitTypes.map((type) => type.id)),
	};
	for (const [key, label] of [
		["blockIds", "Block"],
		["storeyIds", "Storey"],
		["unitTypeIds", "Unit Type"],
	] as const)
		if (selection[key]?.some((id) => !known[key].has(id)))
			throw HttpError.notFound(`${label} not found in this Project`);
	return blocks.flatMap((block) =>
		block.storeys.flatMap((storey) =>
			storey.units.map((unit) => ({
				id: unit.id,
				blockId: block.id,
				storeyId: storey.id,
				unitTypeId: unit.unitTypeId,
			}))
		)
	);
}
