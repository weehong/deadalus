import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { nameKey } from "@/lib/name-key.js";
import { HttpError } from "@/lib/http-error.js";
import { readProject } from "@/services/project-read.js";
import {
	assertNoNameClashes,
	serializable,
} from "@/services/structure-batch.js";
import type { Project } from "@/schemas/project-detail.schema.js";
import type { AddUnitsBody, EditUnitBody } from "@/schemas/units.schema.js";
async function requireType(
	transaction: Prisma.TransactionClient,
	projectId: string,
	unitTypeId: string | null | undefined
): Promise<void> {
	if (
		unitTypeId &&
		!(await transaction.unitType.findFirst({
			where: { id: unitTypeId, projectId },
			select: { id: true },
		}))
	)
		throw HttpError.notFound("Unit Type not found");
}
async function resolveUniqueConflict(
	error: unknown,
	projectId: string,
	storeyIds: Array<string>,
	names: Array<string>,
	excludeId?: string
): Promise<never> {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2002"
	) {
		const siblings = await prisma.unit.findMany({
			where: {
				storeyId: { in: storeyIds },
				storey: { block: { projectId } },
				...(excludeId ? { id: { not: excludeId } } : {}),
			},
			select: { nameKey: true },
		});
		assertNoNameClashes(
			names,
			siblings.map((row) => row.nameKey),
			"UNIT_NAME_TAKEN"
		);
		throw HttpError.conflict("UNIT_NAME_TAKEN", "Names already exist", {
			names,
		});
	}
	throw error;
}
async function resolveMissingType(
	error: unknown,
	projectId: string,
	unitTypeId: string | null | undefined
): Promise<void> {
	if (
		unitTypeId &&
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2003" &&
		!(await prisma.unitType.findFirst({
			where: { id: unitTypeId, projectId },
			select: { id: true },
		}))
	)
		throw HttpError.notFound("Unit Type not found");
}
export async function addUnits(
	projectId: string,
	blockId: string,
	body: AddUnitsBody
): Promise<Project> {
	try {
		return await serializable(async (transaction) => {
			if (
				!(await transaction.block.findFirst({
					where: { id: blockId, projectId },
					select: { id: true },
				}))
			)
				throw HttpError.notFound("Block not found");
			const storeys = await transaction.storey.findMany({
				where: { id: { in: body.storeyIds }, blockId },
				select: { id: true },
			});
			if (storeys.length !== body.storeyIds.length)
				throw HttpError.notFound("Storey not found in Block");
			await requireType(transaction, projectId, body.unitTypeId);
			const siblings = await transaction.unit.findMany({
				where: { storeyId: { in: body.storeyIds } },
				select: { nameKey: true, position: true, storeyId: true },
			});
			assertNoNameClashes(
				body.names,
				siblings.map((row) => row.nameKey),
				"UNIT_NAME_TAKEN"
			);
			const nextPosition = new Map<string, number>();
			for (const sibling of siblings)
				nextPosition.set(
					sibling.storeyId,
					Math.max(
						nextPosition.get(sibling.storeyId) ?? 0,
						sibling.position + 1
					)
				);
			await transaction.unit.createMany({
				data: body.storeyIds.flatMap((storeyId) =>
					body.names.map((name, index) => ({
						storeyId,
						name,
						nameKey: nameKey(name),
						position: (nextPosition.get(storeyId) ?? 0) + index,
						unitTypeId: body.unitTypeId ?? null,
					}))
				),
			});
			return readProject(projectId, transaction);
		});
	} catch (error) {
		await resolveMissingType(error, projectId, body.unitTypeId);
		return resolveUniqueConflict(error, projectId, body.storeyIds, body.names);
	}
}
export async function editUnit(
	projectId: string,
	unitId: string,
	body: EditUnitBody
): Promise<Project> {
	let storeyId = "";
	try {
		return await serializable(async (transaction) => {
			const unit = await transaction.unit.findFirst({
				where: { id: unitId, storey: { block: { projectId } } },
				select: { storeyId: true },
			});
			if (!unit) throw HttpError.notFound("Unit not found");
			storeyId = unit.storeyId;
			await requireType(transaction, projectId, body.unitTypeId);
			if (body.name !== undefined) {
				const siblings = await transaction.unit.findMany({
					where: { storeyId, id: { not: unitId } },
					select: { nameKey: true },
				});
				assertNoNameClashes(
					[body.name],
					siblings.map((row) => row.nameKey),
					"UNIT_NAME_TAKEN"
				);
			}
			await transaction.unit.update({
				where: { id: unitId, storey: { block: { projectId } } },
				data: {
					...(body.name !== undefined
						? { name: body.name, nameKey: nameKey(body.name) }
						: {}),
					...(body.unitTypeId !== undefined
						? { unitTypeId: body.unitTypeId }
						: {}),
				},
			});
			return readProject(projectId, transaction);
		});
	} catch (error) {
		await resolveMissingType(error, projectId, body.unitTypeId);
		return resolveUniqueConflict(
			error,
			projectId,
			[storeyId],
			body.name === undefined ? [] : [body.name],
			unitId
		);
	}
}
export async function deleteUnit(
	projectId: string,
	unitId: string
): Promise<void> {
	await serializable(async (transaction) => {
		if (
			!(await transaction.unit.findFirst({
				where: { id: unitId, storey: { block: { projectId } } },
				select: { id: true },
			}))
		)
			throw HttpError.notFound("Unit not found");
		await transaction.unit.delete({
			where: { id: unitId, storey: { block: { projectId } } },
		});
	});
}
