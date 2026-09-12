import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { HttpError } from "@/lib/http-error.js";
import { readProject } from "@/services/project-read.js";
import { readSelectableUnits } from "@/services/selectable-units.js";
import { selectUnits } from "@/services/unit-selection.js";
import { readUnitItems } from "@/services/unit-items.service.js";
import type { Project } from "@/schemas/project-detail.schema.js";
import type { UnitItem } from "@/schemas/unit-items.schema.js";
import type {
	AssignItemBody,
	AssignMeta,
	BulkAssignBody,
} from "@/schemas/assignments.schema.js";

/**
 * An Assignment is the Item's Subcontractor reference and `assignedAt`, and
 * nothing else: changing it never touches the Item's Progression or its
 * entries (ADR-0008). These are the only columns either write names.
 */
const assignment = (
	subcontractorId: string | null
): Pick<Prisma.ItemUncheckedUpdateInput, "subcontractorId" | "assignedAt"> => ({
	subcontractorId,
	assignedAt: subcontractorId === null ? null : new Date(),
});

async function requireSubcontractor(
	subcontractorId: string | null,
	tx: Pick<Prisma.TransactionClient, "subcontractor">
): Promise<void> {
	if (subcontractorId === null) return;
	if (
		!(await tx.subcontractor.findUnique({
			where: { id: subcontractorId },
			select: { id: true },
		}))
	)
		throw HttpError.notFound("Subcontractor not found");
}

/** A Subcontractor removed between the check and the write leaves Restrict's refusal; say 404. */
function rethrowAssignmentError(error: unknown): never {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2003"
	)
		throw HttpError.notFound("Subcontractor not found");
	throw error;
}

/**
 * Assign every selected Item made from the Catalogue Item to one
 * Subcontractor in one transaction. Unassigned Items are always assigned;
 * Items assigned elsewhere only with `reassign`; Items already the target's
 * are skipped. With `null`, every assigned Item is unassigned and the rest
 * skipped. The counts travel back beside the full Project.
 */
export async function bulkAssign(
	projectId: string,
	body: BulkAssignBody
): Promise<{ project: Project; meta: AssignMeta }> {
	const { catalogueItemId, subcontractorId, reassign = false } = body;
	try {
		return await prisma.$transaction(async (tx) => {
			if (
				!(await tx.catalogueItem.findFirst({
					where: { id: catalogueItemId, projectId },
					select: { id: true },
				}))
			)
				throw HttpError.notFound("Catalogue Item not found");
			await requireSubcontractor(subcontractorId, tx);
			const selected = selectUnits(
				await readSelectableUnits(projectId, body, tx),
				body
			);
			const items = await tx.item.findMany({
				where: {
					unitId: { in: selected.map((unit) => unit.id) },
					catalogueItemId,
				},
				select: { id: true, subcontractorId: true },
			});
			const changing = items.filter((item) =>
				subcontractorId === null
					? item.subcontractorId !== null
					: item.subcontractorId === null ||
						(reassign && item.subcontractorId !== subcontractorId)
			);
			const assigned =
				changing.length === 0
					? 0
					: (
							await tx.item.updateMany({
								where: { id: { in: changing.map((item) => item.id) } },
								data: assignment(subcontractorId),
							})
						).count;
			return {
				project: await readProject(projectId, tx),
				meta: { assigned, skipped: items.length - assigned },
			};
		});
	} catch (error) {
		return rethrowAssignmentError(error);
	}
}

/** Set, change or clear one Item's Assignment; answers with its Unit's Items. */
export async function assignItem(
	projectId: string,
	itemId: string,
	body: AssignItemBody
): Promise<Array<UnitItem>> {
	try {
		return await prisma.$transaction(async (tx) => {
			const item = await tx.item.findFirst({
				where: { id: itemId, unit: { storey: { block: { projectId } } } },
				select: { id: true, unitId: true, subcontractorId: true },
			});
			if (!item) throw HttpError.notFound("Item not found");
			await requireSubcontractor(body.subcontractorId, tx);
			if (item.subcontractorId !== body.subcontractorId)
				await tx.item.update({
					where: { id: item.id },
					data: assignment(body.subcontractorId),
				});
			return readUnitItems(projectId, item.unitId, tx);
		});
	} catch (error) {
		return rethrowAssignmentError(error);
	}
}
