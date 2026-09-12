import { HttpError } from "@/lib/http-error.js";
import { nameKey } from "@/lib/name-key.js";
import type { Project } from "@/schemas/project-detail.schema.js";
import { projectSelect, toProject } from "@/services/project-read.js";
import {
	readProjectRollups,
	readUnitItemRows,
} from "@/services/progression.service.js";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import type {
	CreateProjectBody,
	EditProjectBody,
	ListProjectsQuery,
} from "@/schemas/projects.schema.js";
export interface ProjectRow {
	readonly id: string;
	readonly code: string;
	readonly name: string;
	readonly blockCount: number;
	readonly storeyCount: number;
	readonly unitCount: number;
	readonly itemCount: number;
	/** The plain average of every Item beneath the Project; null with no Items. */
	readonly progression: number | null;
}
export interface ProjectListing {
	readonly rows: Array<ProjectRow>;
	readonly total: number;
}
export async function listProjects(
	query: ListProjectsQuery
): Promise<ProjectListing> {
	const { page, pageSize, q } = query;
	// Prisma contains uses LIKE; searches are literal substrings.
	const substring = (q ?? "").replace(/[\\%_]/g, "\\$&");
	const where: Prisma.ProjectWhereInput = q
		? {
				OR: [
					{ name: { contains: substring, mode: "insensitive" } },
					{ code: { contains: substring, mode: "insensitive" } },
				],
			}
		: {};
	const [records, total] = await prisma.$transaction([
		prisma.project.findMany({
			where,
			orderBy: [{ nameKey: "asc" }, { id: "asc" }],
			skip: (page - 1) * pageSize,
			take: pageSize,
			select: {
				id: true,
				name: true,
				code: true,
				blocks: {
					select: {
						storeys: { select: { _count: { select: { units: true } } } },
					},
				},
			},
		}),
		prisma.project.count({ where }),
	]);
	const rollups = await readProjectRollups(records.map((record) => record.id));
	return {
		rows: records.map((record) => ({
			id: record.id,
			code: record.code,
			name: record.name,
			itemCount: rollups.get(record.id)?.itemCount ?? 0,
			progression: rollups.get(record.id)?.progression ?? null,
			blockCount: record.blocks.length,
			storeyCount: record.blocks.reduce(
				(total, block) => total + block.storeys.length,
				0
			),
			unitCount: record.blocks.reduce(
				(total, block) =>
					total +
					block.storeys.reduce(
						(subtotal, storey) => subtotal + storey._count.units,
						0
					),
				0
			),
		})),
		total,
	};
}

export function rethrowProjectConflict(error: unknown): never {
	if (
		error instanceof Prisma.PrismaClientKnownRequestError &&
		error.code === "P2002"
	) {
		const target = error.meta?.["target"];
		const constraints = Array.isArray(target) ? target : [target];
		if (
			constraints.includes("code") ||
			constraints.includes("projects_code_key")
		)
			throw HttpError.conflict(
				"PROJECT_CODE_TAKEN",
				"A Project with this code already exists"
			);
		if (
			constraints.includes("nameKey") ||
			constraints.includes("projects_nameKey_key")
		)
			throw HttpError.conflict(
				"PROJECT_NAME_TAKEN",
				"A Project with this name already exists"
			);
	}
	throw error;
}

export async function createProject(
	input: CreateProjectBody
): Promise<Project> {
	try {
		const record = await prisma.project.create({
			data: {
				name: input.name,
				nameKey: nameKey(input.name),
				code: input.code,
			},
			select: projectSelect,
		});
		return toProject(record);
	} catch (error) {
		return rethrowProjectConflict(error);
	}
}

export async function editProject(
	id: string,
	input: EditProjectBody
): Promise<Project> {
	try {
		const record = await prisma.project.update({
			where: { id },
			data: {
				...input,
				...(input.name !== undefined ? { nameKey: nameKey(input.name) } : {}),
			},
			select: projectSelect,
		});
		return toProject(record, await readUnitItemRows(id));
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		)
			throw HttpError.notFound("Project not found");
		return rethrowProjectConflict(error);
	}
}

export async function deleteProject(id: string): Promise<void> {
	try {
		await prisma.$transaction(async (transaction) => {
			// Delete Units through Blocks before cascading Unit Types: their reference
			// deliberately uses Restrict to protect standalone Unit Type deletion.
			await transaction.block.deleteMany({ where: { projectId: id } });
			await transaction.project.delete({ where: { id } });
		});
	} catch (error) {
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			error.code === "P2025"
		)
			throw HttpError.notFound("Project not found");
		throw error;
	}
}
