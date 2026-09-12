import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { HttpError } from "@/lib/http-error.js";
import { unitTypeCodeKey } from "@/lib/name-key.js";
import { readProject } from "@/services/project-read.js";
import type { Project } from "@/schemas/project-detail.schema.js";
import type {
	AddUnitTypeBody,
	EditUnitTypeBody,
} from "@/schemas/projects.schema.js";

function rethrowUnitTypeError(error: unknown): never {
	if (error instanceof Prisma.PrismaClientKnownRequestError) {
		const target = error.meta?.["target"];
		const constraints = Array.isArray(target) ? target : [target];
		if (
			error.code === "P2002" &&
			(constraints.includes("codeKey") ||
				constraints.includes("unit_types_projectId_codeKey_key"))
		)
			throw HttpError.conflict(
				"UNIT_TYPE_CODE_TAKEN",
				"A Unit Type with this code already exists"
			);
		if (error.code === "P2025" || error.code === "P2003")
			throw HttpError.notFound("Project or Unit Type not found");
	}
	throw error;
}

export async function addUnitType(
	projectId: string,
	input: AddUnitTypeBody
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
			await tx.unitType.create({
				data: {
					projectId,
					code: input.code,
					codeKey: unitTypeCodeKey(input.code),
					description: input.description || null,
				},
			});
			return readProject(projectId, tx);
		});
	} catch (error) {
		return rethrowUnitTypeError(error);
	}
}

export async function editUnitType(
	projectId: string,
	id: string,
	input: EditUnitTypeBody
): Promise<Project> {
	try {
		return await prisma.$transaction(async (tx) => {
			if (
				!(await tx.unitType.findFirst({
					where: { id, projectId },
					select: { id: true },
				}))
			)
				throw HttpError.notFound("Unit Type not found");
			await tx.unitType.update({
				where: { id, projectId },
				data: {
					...(input.code === undefined
						? {}
						: { code: input.code, codeKey: unitTypeCodeKey(input.code) }),
					...(input.description === undefined
						? {}
						: { description: input.description || null }),
				},
			});
			return readProject(projectId, tx);
		});
	} catch (error) {
		return rethrowUnitTypeError(error);
	}
}

export async function deleteUnitType(
	projectId: string,
	id: string
): Promise<void> {
	if (
		!(await prisma.unitType.findFirst({
			where: { id, projectId },
			select: { id: true },
		}))
	)
		throw HttpError.notFound("Unit Type not found");
	const unitCount = await prisma.unit.count({ where: { unitTypeId: id } });
	if (unitCount > 0)
		throw HttpError.conflict(
			"UNIT_TYPE_IN_USE",
			"Units still use this Unit Type",
			{ unitCount }
		);
	try {
		await prisma.unitType.delete({ where: { id, projectId } });
	} catch (error) {
		// Restrict remains authoritative if a concurrent Unit write wins after the check.
		// Query outside any failed transaction so the returned count is current.
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2003"
		) {
			const currentCount = await prisma.unit.count({
				where: { unitTypeId: id },
			});
			throw HttpError.conflict(
				"UNIT_TYPE_IN_USE",
				"Unit Type usage changed; refresh and try again",
				{ unitCount: currentCount }
			);
		}
		rethrowUnitTypeError(error);
	}
}
