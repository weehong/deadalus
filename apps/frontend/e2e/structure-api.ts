import type { Route } from "@playwright/test";
import type { FakeProject } from "./projects-api";
import type { StructureBody } from "../src/features/projects/matrix-to-structure";
export async function handleStructure(
	route: Route,
	records: Array<FakeProject>
): Promise<boolean> {
	const match = /^\/api\/v1\/projects\/([^/]+)\/structure$/.exec(
		new URL(route.request().url()).pathname
	);
	if (!match || route.request().method() !== "POST") return false;
	const project = records.find(
		(entry) => entry.id === decodeURIComponent(match[1]!)
	);
	if (!project) {
		await route.fulfill({
			status: 404,
			json: { error: { code: "NOT_FOUND" } },
		});
		return true;
	}
	if (project.blocks.length) {
		await route.fulfill({
			status: 409,
			json: {
				error: {
					code: "PROJECT_HAS_BLOCKS",
					details: { blockCount: project.blocks.length },
				},
			},
		});
		return true;
	}
	const body = route.request().postDataJSON() as StructureBody;
	const key = (code: string): string => code.toUpperCase().replace(/\s/g, "");
	project.blocks = body.blocks.map((block, position) => ({
		id: `import-block-${position}`,
		name: block.name,
		position,
		storeys: block.storeys.map((storey, position) => ({
			id: `import-storey-${block.name}-${position}`,
			name: storey.name,
			position,
			units: storey.units.map((unit, position) => {
				let type = project.unitTypes.find(
					(entry) =>
						unit.unitTypeCode && key(entry.code) === key(unit.unitTypeCode)
				);
				if (unit.unitTypeCode && !type) {
					type = {
						id: `import-type-${project.unitTypes.length}`,
						code: unit.unitTypeCode,
						description: null,
					};
					project.unitTypes.push(type);
				}
				return {
					id: `import-unit-${block.name}-${storey.name}-${position}`,
					name: unit.name,
					position,
					unitTypeId: type?.id ?? null,
				};
			}),
		})),
	}));
	await route.fulfill({
		status: 201,
		json: {
			data: {
				...project,
				unitTypes: project.unitTypes.map((type) => ({
					...type,
					unitCount: project.blocks
						.flatMap((block) => block.storeys.flatMap((storey) => storey.units))
						.filter((unit) => unit.unitTypeId === type.id).length,
				})),
			},
		},
	});
	return true;
}
