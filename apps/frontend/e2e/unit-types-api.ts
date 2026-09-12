import type { Route } from "@playwright/test";
import type { FakeProject } from "./projects-api";
import type { Project } from "../src/features/projects/types";

const codeKey = (code: string): string => code.replace(/\s/g, "").toUpperCase();
const fullProject = (project: FakeProject): Project => {
	const ordered = <T extends { id: string; position: number }>(
		rows: Array<T>
	): Array<T> =>
		[...rows].sort(
			(a, b) => a.position - b.position || a.id.localeCompare(b.id)
		);
	const units = project.blocks
		.flatMap((block) => block.storeys)
		.flatMap((storey) => storey.units);
	return {
		...project,
		blocks: ordered(project.blocks).map((block) => ({
			...block,
			storeys: ordered(block.storeys).map((storey) => ({
				...storey,
				units: ordered(storey.units),
			})),
		})),
		unitTypes: [...project.unitTypes]
			.sort(
				(a, b) =>
					codeKey(a.code).localeCompare(codeKey(b.code)) ||
					a.id.localeCompare(b.id)
			)
			.map((type) => ({
				...type,
				unitCount: units.filter((unit) => unit.unitTypeId === type.id).length,
			})),
	};
};
export const handleUnitTypes = async (
	route: Route,
	records: Array<FakeProject>
): Promise<boolean> => {
	const request = route.request();
	const match = /^\/api\/v1\/projects\/([^/]+)\/unit-types(?:\/([^/]+))?$/.exec(
		new URL(request.url()).pathname
	);
	if (!match) return false;
	const method = request.method();
	const project = records.find(
		(record) => record.id === decodeURIComponent(match[1]!)
	);
	const id = match[2] ? decodeURIComponent(match[2]) : undefined;
	const type = project?.unitTypes.find((type) => type.id === id);
	if (
		!project ||
		(method !== "POST" && !type) ||
		(method === "POST" && id) ||
		!["POST", "PATCH", "DELETE"].includes(method)
	) {
		await route.fulfill({
			status: 404,
			json: {
				error: { code: "NOT_FOUND", message: "Unit Type or Project not found" },
			},
		});
		return true;
	}
	if (method === "DELETE" && type) {
		const unitCount = project.blocks
			.flatMap((block) => block.storeys)
			.flatMap((storey) => storey.units)
			.filter((unit) => unit.unitTypeId === id).length;
		if (unitCount)
			await route.fulfill({
				status: 409,
				json: {
					error: {
						code: "UNIT_TYPE_IN_USE",
						message: "Units still use this Unit Type",
						details: { unitCount },
					},
				},
			});
		else {
			project.unitTypes = project.unitTypes.filter((type) => type.id !== id);
			await route.fulfill({ status: 204 });
		}
		return true;
	}
	const body: unknown = request.postDataJSON();
	const input = body as { code?: unknown; description?: unknown };
	const code = typeof input?.code === "string" ? input.code.trim() : undefined;
	const description =
		typeof input?.description === "string"
			? input.description.trim()
			: input?.description;
	const fieldErrors: { code?: Array<string>; description?: Array<string> } = {};
	if (
		(method === "POST" || input?.code !== undefined) &&
		(!code || code.length > 40)
	)
		fieldErrors.code = ["Invalid code"];
	if (
		description !== undefined &&
		description !== null &&
		(typeof description !== "string" || description.length > 120)
	)
		fieldErrors.description = ["Invalid description"];
	if (Object.keys(fieldErrors).length || (!code && description === undefined)) {
		await route.fulfill({
			status: 400,
			json: {
				error: {
					code: "BAD_REQUEST",
					message: "Invalid Unit Type",
					details: { fieldErrors },
				},
			},
		});
		return true;
	}
	if (
		code &&
		project.unitTypes.some(
			(type) => type.id !== id && codeKey(type.code) === codeKey(code)
		)
	) {
		await route.fulfill({
			status: 409,
			json: {
				error: { code: "UNIT_TYPE_CODE_TAKEN", message: "Already taken" },
			},
		});
		return true;
	}
	if (method === "POST")
		project.unitTypes.push({
			id: `type-${crypto.randomUUID()}`,
			code: code!,
			description:
				typeof description === "string" && description ? description : null,
		});
	else if (type) {
		if (code !== undefined) type.code = code;
		if (description !== undefined)
			type.description =
				typeof description === "string" && description ? description : null;
	}
	await route.fulfill({
		status: method === "POST" ? 201 : 200,
		json: { data: fullProject(project) },
	});
	return true;
};
