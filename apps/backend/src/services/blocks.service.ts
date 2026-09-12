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
	names: Array<string>,
	excludeId?: string
): Promise<never> {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2002"
	) {
		const siblings = await prisma.block.findMany({
			where: { projectId, ...(excludeId ? { id: { not: excludeId } } : {}) },
			select: { nameKey: true },
		});
		assertNoNameClashes(
			names,
			siblings.map((row) => row.nameKey),
			"BLOCK_NAME_TAKEN"
		);
		// A winner can be deleted between the failed insert and this lookup.
		throw HttpError.conflict("BLOCK_NAME_TAKEN", "Names already exist", {
			names,
		});
	}
	throw error;
}
export async function addBlocks(
	projectId: string,
	names: Array<string>
): Promise<Project> {
	try {
		return await serializable(async (transaction) => {
			if (
				!(await transaction.project.findUnique({
					where: { id: projectId },
					select: { id: true },
				}))
			)
				throw HttpError.notFound("Project not found");
			const siblings = await transaction.block.findMany({
				where: { projectId },
				select: { nameKey: true, position: true },
			});
			assertNoNameClashes(
				names,
				siblings.map((row) => row.nameKey),
				"BLOCK_NAME_TAKEN"
			);
			const start =
				siblings.reduce((max, row) => Math.max(max, row.position), -1) + 1;
			await transaction.block.createMany({
				data: names.map((name, index) => ({
					projectId,
					name,
					nameKey: nameKey(name),
					position: start + index,
				})),
			});
			return readProject(projectId, transaction);
		});
	} catch (error) {
		return resolveUniqueConflict(error, projectId, names);
	}
}
export async function renameBlock(
	projectId: string,
	blockId: string,
	name: string
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
			const siblings = await transaction.block.findMany({
				where: { projectId, id: { not: blockId } },
				select: { nameKey: true },
			});
			assertNoNameClashes(
				[name],
				siblings.map((row) => row.nameKey),
				"BLOCK_NAME_TAKEN"
			);
			await transaction.block.update({
				where: { id: blockId, projectId },
				data: { name, nameKey: nameKey(name) },
			});
			return readProject(projectId, transaction);
		});
	} catch (error) {
		return resolveUniqueConflict(error, projectId, [name], blockId);
	}
}
export async function deleteBlock(
	projectId: string,
	blockId: string
): Promise<void> {
	await serializable(async (transaction) => {
		if (
			!(await transaction.block.findFirst({
				where: { id: blockId, projectId },
				select: { id: true },
			}))
		)
			throw HttpError.notFound("Block not found");
		await transaction.block.delete({ where: { id: blockId, projectId } });
	});
}
