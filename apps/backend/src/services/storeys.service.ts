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

async function resolveUniqueConflict(
	error: unknown,
	projectId: string,
	blockId: string,
	names: Array<string>,
	excludeId?: string
): Promise<never> {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2002"
	) {
		const siblings = await prisma.storey.findMany({
			where: {
				blockId,
				block: { projectId },
				...(excludeId ? { id: { not: excludeId } } : {}),
			},
			select: { nameKey: true },
		});
		assertNoNameClashes(
			names,
			siblings.map((row) => row.nameKey),
			"STOREY_NAME_TAKEN"
		);
		throw HttpError.conflict("STOREY_NAME_TAKEN", "Names already exist", {
			names,
		});
	}
	throw error;
}
export async function addStoreys(
	projectId: string,
	blockId: string,
	names: Array<string>
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
			const siblings = await transaction.storey.findMany({
				where: { blockId },
				select: { nameKey: true, position: true },
			});
			assertNoNameClashes(
				names,
				siblings.map((row) => row.nameKey),
				"STOREY_NAME_TAKEN"
			);
			const start =
				siblings.reduce((max, row) => Math.max(max, row.position), -1) + 1;
			await transaction.storey.createMany({
				data: names.map((name, index) => ({
					blockId,
					name,
					nameKey: nameKey(name),
					position: start + index,
				})),
			});
			return readProject(projectId, transaction);
		});
	} catch (error) {
		return resolveUniqueConflict(error, projectId, blockId, names);
	}
}
export async function renameStorey(
	projectId: string,
	storeyId: string,
	name: string
): Promise<Project> {
	let blockId = "";
	try {
		return await serializable(async (transaction) => {
			const storey = await transaction.storey.findFirst({
				where: { id: storeyId, block: { projectId } },
				select: { blockId: true },
			});
			if (!storey) throw HttpError.notFound("Storey not found");
			blockId = storey.blockId;
			const siblings = await transaction.storey.findMany({
				where: { blockId, id: { not: storeyId } },
				select: { nameKey: true },
			});
			assertNoNameClashes(
				[name],
				siblings.map((row) => row.nameKey),
				"STOREY_NAME_TAKEN"
			);
			await transaction.storey.update({
				where: { id: storeyId, block: { projectId } },
				data: { name, nameKey: nameKey(name) },
			});
			return readProject(projectId, transaction);
		});
	} catch (error) {
		return resolveUniqueConflict(error, projectId, blockId, [name], storeyId);
	}
}
export async function deleteStorey(
	projectId: string,
	storeyId: string
): Promise<void> {
	await serializable(async (transaction) => {
		if (
			!(await transaction.storey.findFirst({
				where: { id: storeyId, block: { projectId } },
				select: { id: true },
			}))
		)
			throw HttpError.notFound("Storey not found");
		await transaction.storey.delete({
			where: { id: storeyId, block: { projectId } },
		});
	});
}
