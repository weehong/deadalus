import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { HttpError } from "@/lib/http-error.js";
import { nameKey, unitTypeCodeKey } from "@/lib/name-key.js";
import type { CommitStructureBody } from "@/schemas/commit-structure.schema.js";
import type { Project } from "@/schemas/project-detail.schema.js";
import { readProject } from "@/services/project-read.js";
import { serializable } from "@/services/structure-batch.js";
export async function commitStructure(
	projectId: string,
	body: CommitStructureBody
): Promise<Project> {
	return serializable(
		async (transaction) => {
			const project = await transaction.project.findUnique({
				where: { id: projectId },
				select: { id: true },
			});
			if (!project) throw HttpError.notFound("Project not found");
			const blockCount = await transaction.block.count({
				where: { projectId },
			});
			if (blockCount)
				throw HttpError.conflict(
					"PROJECT_HAS_BLOCKS",
					"Delete existing Blocks before importing",
					{ blockCount }
				);
			const existing = await transaction.unitType.findMany({
				where: { projectId },
				select: { id: true, codeKey: true },
			});
			const types = new Map(existing.map((entry) => [entry.codeKey, entry.id]));
			const newTypes: Array<Prisma.UnitTypeCreateManyInput> = [];
			const blocks: Array<Prisma.BlockCreateManyInput> = [];
			const storeys: Array<Prisma.StoreyCreateManyInput> = [];
			const units: Array<Prisma.UnitCreateManyInput> = [];
			for (const [position, block] of body.blocks.entries()) {
				const blockId = randomUUID();
				blocks.push({
					id: blockId,
					projectId,
					name: block.name,
					nameKey: nameKey(block.name),
					position,
				});
				for (const [position, storey] of block.storeys.entries()) {
					const storeyId = randomUUID();
					storeys.push({
						id: storeyId,
						blockId,
						name: storey.name,
						nameKey: nameKey(storey.name),
						position,
					});
					for (const [position, unit] of storey.units.entries()) {
						let unitTypeId: string | null = null;
						if (unit.unitTypeCode !== undefined) {
							const codeKey = unitTypeCodeKey(unit.unitTypeCode);
							unitTypeId = types.get(codeKey) ?? randomUUID();
							if (!types.has(codeKey)) {
								types.set(codeKey, unitTypeId);
								newTypes.push({
									id: unitTypeId,
									projectId,
									code: unit.unitTypeCode,
									codeKey,
									description: null,
								});
							}
						}
						units.push({
							id: randomUUID(),
							storeyId,
							name: unit.name,
							nameKey: nameKey(unit.name),
							position,
							unitTypeId,
						});
					}
				}
			}
			// Bounded batches avoid PostgreSQL parameter limits and thousands of round trips.
			for (let offset = 0; offset < newTypes.length; offset += 1000) {
				// eslint-disable-next-line no-await-in-loop
				await transaction.unitType.createMany({
					data: newTypes.slice(offset, offset + 1000),
				});
			}
			await transaction.block.createMany({ data: blocks });
			for (let offset = 0; offset < storeys.length; offset += 1000) {
				// eslint-disable-next-line no-await-in-loop
				await transaction.storey.createMany({
					data: storeys.slice(offset, offset + 1000),
				});
			}
			for (let offset = 0; offset < units.length; offset += 1000) {
				// eslint-disable-next-line no-await-in-loop
				await transaction.unit.createMany({
					data: units.slice(offset, offset + 1000),
				});
			}
			return readProject(projectId, transaction);
		},
		60_000,
		true
	);
}
