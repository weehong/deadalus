import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { HttpError } from "@/lib/http-error.js";
import { nameKey } from "@/lib/name-key.js";
import { readProject } from "@/services/project-read.js";
import type { Project } from "@/schemas/project-detail.schema.js";
import type { CatalogueItemBody } from "@/schemas/catalogue-items.schema.js";
import type {
	ApplyMeta,
	RemoveMeta,
	UnitSelectionBody,
} from "@/schemas/unit-selection.schema.js";
import { selectUnits } from "@/services/unit-selection.js";
import { readSelectableUnits } from "@/services/selectable-units.js";
import { deleteUnlessHeld } from "@/services/delete-unless-held.js";

function rethrowCatalogueItemError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		const target = error.meta?.["target"];
		const constraints = Array.isArray(target) ? target : [target];
		if (
			error.code === "P2002" &&
			(constraints.includes("nameKey") ||
				constraints.includes("catalogue_items_projectId_nameKey_key"))
		)
			throw HttpError.conflict(
				"CATALOGUE_ITEM_NAME_TAKEN",
				"A Catalogue Item with this name already exists"
			);
		if (error.code === "P2025" || error.code === "P2003")
			throw HttpError.notFound("Project or Catalogue Item not found");
	}
	throw error;
}

export async function addCatalogueItem(
	projectId: string,
	input: CatalogueItemBody
): Promise<Project> {
	try {
		return await prisma.$transaction(async (tx) => {
			if (
				!(await tx.project.findUnique({
					where: { id: projectId },
					select: { id: true },
				}))
			)
				throw HttpError.notFound("Project not found");
			await tx.catalogueItem.create({
				data: { projectId, name: input.name, nameKey: nameKey(input.name) },
			});
			return readProject(projectId, tx);
		});
	} catch (error) {
		return rethrowCatalogueItemError(error);
	}
}

/** Items carry no name of their own, so renaming the Catalogue Item renames every Item made from it. */
export async function renameCatalogueItem(
	projectId: string,
	id: string,
	input: CatalogueItemBody
): Promise<Project> {
	try {
		return await prisma.$transaction(async (tx) => {
			if (
				!(await tx.catalogueItem.findFirst({
					where: { id, projectId },
					select: { id: true },
				}))
			)
				throw HttpError.notFound("Catalogue Item not found");
			await tx.catalogueItem.update({
				where: { id, projectId },
				data: { name: input.name, nameKey: nameKey(input.name) },
			});
			return readProject(projectId, tx);
		});
	} catch (error) {
		return rethrowCatalogueItemError(error);
	}
}

export async function deleteCatalogueItem(
	projectId: string,
	id: string
): Promise<void> {
	if (
		!(await prisma.catalogueItem.findFirst({
			where: { id, projectId },
			select: { id: true },
		}))
	)
		throw HttpError.notFound("Catalogue Item not found");
	try {
		await deleteUnlessHeld(
			{ catalogueItemId: id },
			{
				code: "CATALOGUE_ITEM_IN_USE",
				message: "Units still hold Items made from this Catalogue Item",
				changedMessage: "Catalogue Item usage changed; refresh and try again",
			},
			async () => {
				await prisma.catalogueItem.delete({ where: { id, projectId } });
			}
		);
	} catch (error) {
		rethrowCatalogueItemError(error);
	}
}

/**
 * Create one Item in every selected Unit that holds none for this Catalogue
 * Item (ADR-0008). One transaction, one bulk insert skipping duplicates, so
 * applying the same selection twice is safe: everything is skipped.
 */
export async function applyCatalogueItem(
	projectId: string,
	catalogueItemId: string,
	selection: UnitSelectionBody
): Promise<{ project: Project; meta: ApplyMeta }> {
	return prisma.$transaction(async (tx) => {
		if (
			!(await tx.catalogueItem.findFirst({
				where: { id: catalogueItemId, projectId },
				select: { id: true },
			}))
		)
			throw HttpError.notFound("Catalogue Item not found");
		const selected = selectUnits(
			await readSelectableUnits(projectId, selection, tx),
			selection
		);
		const { count: added } = await tx.item.createMany({
			data: selected.map((unit) => ({ unitId: unit.id, catalogueItemId })),
			skipDuplicates: true,
		});
		return {
			project: await readProject(projectId, tx),
			meta: { added, skipped: selected.length - added },
		};
	});
}

/**
 * Delete the Item made from this Catalogue Item in every selected Unit that
 * holds one, taking its Progress entries with it by cascade (ADR-0008). The
 * entries are counted inside the transaction before the delete, so the
 * counts answered are exactly what went.
 */
export async function removeCatalogueItem(
	projectId: string,
	catalogueItemId: string,
	selection: UnitSelectionBody
): Promise<{ project: Project; meta: RemoveMeta }> {
	return prisma.$transaction(async (tx) => {
		if (
			!(await tx.catalogueItem.findFirst({
				where: { id: catalogueItemId, projectId },
				select: { id: true },
			}))
		)
			throw HttpError.notFound("Catalogue Item not found");
		const selected = selectUnits(
			await readSelectableUnits(projectId, selection, tx),
			selection
		);
		const where = {
			catalogueItemId,
			unitId: { in: selected.map((unit) => unit.id) },
		};
		const entriesRemoved = await tx.progressEntry.count({
			where: { item: where },
		});
		const { count: removed } = await tx.item.deleteMany({ where });
		return {
			project: await readProject(projectId, tx),
			meta: { removed, entriesRemoved },
		};
	});
}
