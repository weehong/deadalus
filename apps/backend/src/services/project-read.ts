import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma.js";
import { HttpError } from "@/lib/http-error.js";
import type { Project } from "@/schemas/project-detail.schema.js";
export const projectSelect = {
	id: true,
	name: true,
	code: true,
	blocks: {
		orderBy: [{ position: "asc" }, { id: "asc" }],
		select: {
			id: true,
			name: true,
			position: true,
			storeys: {
				orderBy: [{ position: "asc" }, { id: "asc" }],
				select: {
					id: true,
					name: true,
					position: true,
					units: {
						orderBy: [{ position: "asc" }, { id: "asc" }],
						select: { id: true, name: true, position: true, unitTypeId: true },
					},
				},
			},
		},
	},
	unitTypes: {
		orderBy: [{ codeKey: "asc" }, { id: "asc" }],
		select: {
			id: true,
			code: true,
			description: true,
			_count: { select: { units: true } },
		},
	},
} satisfies Prisma.ProjectSelect;
export function toProject(
	record: Prisma.ProjectGetPayload<{ select: typeof projectSelect }>
): Project {
	return {
		...record,
		unitTypes: record.unitTypes.map(({ _count, ...unitType }) => ({
			...unitType,
			unitCount: _count.units,
		})),
	};
}
export async function readProject(
	id: string,
	database: Pick<Prisma.TransactionClient, "project"> = prisma
): Promise<Project> {
	const record = await database.project.findUnique({
		where: { id },
		select: projectSelect,
	});
	if (!record) throw HttpError.notFound("Project not found");
	return toProject(record);
}
