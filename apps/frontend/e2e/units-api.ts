import type { Route } from "@playwright/test";
import { fullProject } from "./catalogue-items-api";
import type { FakeProject } from "./projects-api";
const key = (name: string): string =>
	name.trim().replace(/\s+/g, " ").toLowerCase();
export const handleUnits = async (
	route: Route,
	records: Array<FakeProject>
): Promise<boolean> => {
	const request = route.request();
	const path = new URL(request.url()).pathname;
	const add = /^\/api\/v1\/projects\/([^/]+)\/blocks\/([^/]+)\/units$/.exec(
		path
	);
	const edit = /^\/api\/v1\/projects\/([^/]+)\/units\/([^/]+)$/.exec(path);
	const match = add ?? edit;
	if (!match) return false;
	const project = records.find((p) => p.id === decodeURIComponent(match[1]!));
	const method = request.method();
	const fail = async (
		status: number,
		code: string,
		details?: unknown
	): Promise<boolean> => {
		await route.fulfill({
			status,
			json: { error: { code, message: code, details } },
		});
		return true;
	};
	if (!project) return fail(404, "NOT_FOUND");
	const unitId = edit ? decodeURIComponent(edit[2]!) : undefined;
	const storey = project.blocks
		.flatMap((b) => b.storeys)
		.find((s) => s.units.some((u) => u.id === unitId));
	const unit = storey?.units.find((u) => u.id === unitId);
	if (edit && !unit) return fail(404, "NOT_FOUND");
	if (method === "DELETE" && storey && unit) {
		storey.units = storey.units.filter((u) => u.id !== unit.id);
		await route.fulfill({ status: 204 });
		return true;
	}
	const body = request.postDataJSON() as {
		names?: Array<string>;
		storeyIds?: Array<string>;
		name?: string;
		unitTypeId?: string | null;
	};
	if (
		body.unitTypeId &&
		!project.unitTypes.some((t) => t.id === body.unitTypeId)
	)
		return fail(404, "NOT_FOUND");
	if (add && method === "POST") {
		const block = project.blocks.find(
			(b) => b.id === decodeURIComponent(add[2]!)
		);
		if (!block) return fail(404, "NOT_FOUND");
		const names = body.names?.map((n) => n.trim());
		const ids = body.storeyIds;
		if (
			!names?.length ||
			names.length > 500 ||
			names.some((n) => !n || n.length > 60) ||
			new Set(names.map(key)).size !== names.length ||
			!ids?.length ||
			ids.length > 200 ||
			new Set(ids).size !== ids.length ||
			ids.length * names.length > 2000
		)
			return fail(400, "BAD_REQUEST");
		const selected = block.storeys.filter((s) => ids.includes(s.id));
		if (selected.length !== ids.length) return fail(404, "NOT_FOUND");
		const clashes = names.filter((n) =>
			selected.some((s) => s.units.some((u) => key(u.name) === key(n)))
		);
		if (clashes.length) return fail(409, "UNIT_NAME_TAKEN", { names: clashes });
		for (const selectedStorey of selected) {
			const start =
				selectedStorey.units.reduce((max, u) => Math.max(max, u.position), -1) +
				1;
			selectedStorey.units.push(
				...names.map((name, index) => ({
					id: crypto.randomUUID(),
					name,
					position: start + index,
					unitTypeId: body.unitTypeId ?? null,
				}))
			);
		}
	} else if (edit && method === "PATCH" && unit && storey) {
		if (body.name === undefined && body.unitTypeId === undefined)
			return fail(400, "BAD_REQUEST");
		if (body.name !== undefined) {
			const name = body.name.trim();
			if (!name || name.length > 60) return fail(400, "BAD_REQUEST");
			if (
				storey.units.some((u) => u.id !== unit.id && key(u.name) === key(name))
			)
				return fail(409, "UNIT_NAME_TAKEN", { names: [name] });
			unit.name = name;
		}
		if (body.unitTypeId !== undefined) unit.unitTypeId = body.unitTypeId;
	} else return fail(404, "NOT_FOUND");
	await route.fulfill({
		status: add ? 201 : 200,
		json: { data: fullProject(project) },
	});
	return true;
};
