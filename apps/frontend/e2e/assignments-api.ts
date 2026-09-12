import type { Route } from "@playwright/test";
import { fullProject, latestEntryOf, type FakeItem } from "./catalogue-items-api";
import { ASSIGNED_AT, nameKey } from "./fake-shared";
import type { FakeProject, FakeUnit } from "./projects-api";
import type { FakeSubcontractor } from "./subcontractors-api";
import type { UnitItem } from "../src/common/items";

// The browser-edge fake of the Assignment routes and the Unit's Items read.
// It implements the API contract only, never backend internals.
/** Fixture Items carry no id of their own; the fake names each by its Unit and Catalogue Item. */
export const fakeItemId = (unit: FakeUnit, item: FakeItem): string =>
	`${unit.id}:${item.catalogueItemId}`;
export const unitsOf = (project: FakeProject): Array<FakeUnit> =>
	project.blocks
		.flatMap((block) => block.storeys)
		.flatMap((storey) => storey.units);
const selectedUnits = (
	project: FakeProject,
	body: {
		blockIds?: Array<string>;
		storeyIds?: Array<string>;
		unitTypeIds?: Array<string>;
	}
): Array<FakeUnit> =>
	project.blocks
		.filter((block) => !body.blockIds || body.blockIds.includes(block.id))
		.flatMap((block) => block.storeys)
		.filter((storey) => !body.storeyIds || body.storeyIds.includes(storey.id))
		.flatMap((storey) => storey.units)
		.filter(
			(unit) =>
				!body.unitTypeIds ||
				(unit.unitTypeId !== null && body.unitTypeIds.includes(unit.unitTypeId))
		);
/** The Unit's Items read: name from the Catalogue, Assignment from the Directory, latest entry from the history, ordered by name key. */
export const unitItems = (
	project: FakeProject,
	unit: FakeUnit,
	directory: Array<FakeSubcontractor>
): Array<UnitItem> =>
	(unit.items ?? [])
		.map((item) => {
			const subcontractor = item.subcontractorId
				? directory.find((entry) => entry.id === item.subcontractorId)
				: undefined;
			return {
				id: fakeItemId(unit, item),
				catalogueItemId: item.catalogueItemId,
				name:
					project.catalogueItems?.find(
						(entry) => entry.id === item.catalogueItemId
					)?.name ?? item.catalogueItemId,
				subcontractor: subcontractor
					? { id: subcontractor.id, name: subcontractor.name }
					: null,
				assignedAt: item.subcontractorId ? ASSIGNED_AT : null,
				progression: item.progression,
				latestEntry: latestEntryOf(item),
			};
		})
		.sort(
			(a, b) =>
				nameKey(a.name).localeCompare(nameKey(b.name)) ||
				a.id.localeCompare(b.id)
		);
const notFound = (route: Route, message: string): Promise<void> =>
	route.fulfill({
		status: 404,
		json: { error: { code: "NOT_FOUND", message } },
	});
const badRequest = (route: Route, message: string): Promise<void> =>
	route.fulfill({
		status: 400,
		json: { error: { code: "BAD_REQUEST", message } },
	});
/** A target is a Subcontractor id or null; anything else is malformed. */
const readTarget = (body: Record<string, unknown>): string | null | undefined =>
	body["subcontractorId"] === null
		? null
		: typeof body["subcontractorId"] === "string" && body["subcontractorId"]
			? body["subcontractorId"]
			: undefined;

export const handleAssignments = async (
	route: Route,
	records: Array<FakeProject>,
	directory: Array<FakeSubcontractor>
): Promise<boolean> => {
	const request = route.request();
	const pathname = new URL(request.url()).pathname;
	const method = request.method();
	const bulk = /^\/api\/v1\/projects\/([^/]+)\/assignments$/.exec(pathname);
	const one = /^\/api\/v1\/projects\/([^/]+)\/items\/([^/]+)$/.exec(pathname);
	const read = /^\/api\/v1\/projects\/([^/]+)\/units\/([^/]+)\/items$/.exec(
		pathname
	);
	const match = bulk ?? one ?? read;
	if (!match) return false;
	if (
		(bulk && method !== "POST") ||
		(one && method !== "PATCH") ||
		(read && method !== "GET")
	)
		return false;
	const project = records.find(
		(record) => record.id === decodeURIComponent(match[1]!)
	);
	if (!project) {
		await notFound(route, "Project not found");
		return true;
	}
	if (read) {
		const unit = unitsOf(project).find(
			(entry) => entry.id === decodeURIComponent(read[2]!)
		);
		if (!unit) await notFound(route, "Unit not found");
		else await route.fulfill({ json: { data: unitItems(project, unit, directory) } });
		return true;
	}
	const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
	const target = readTarget(body);
	if (target === undefined) {
		await badRequest(route, "subcontractorId must be a string or null");
		return true;
	}
	if (target !== null && !directory.some((entry) => entry.id === target)) {
		await notFound(route, "Subcontractor not found");
		return true;
	}
	if (one) {
		const itemId = decodeURIComponent(one[2]!);
		const held = unitsOf(project)
			.flatMap((unit) => (unit.items ?? []).map((item) => ({ unit, item })))
			.find(({ unit, item }) => fakeItemId(unit, item) === itemId);
		if (!held) {
			await notFound(route, "Item not found");
			return true;
		}
		held.item.subcontractorId = target;
		await route.fulfill({
			json: { data: unitItems(project, held.unit, directory) },
		});
		return true;
	}
	const catalogueItemId = body["catalogueItemId"];
	const reassign = body["reassign"];
	const lists = ["blockIds", "storeyIds", "unitTypeIds"] as const;
	if (
		typeof catalogueItemId !== "string" ||
		!catalogueItemId ||
		(reassign !== undefined && typeof reassign !== "boolean") ||
		lists.some((key) => {
			const list = body[key];
			return (
				list !== undefined &&
				(!Array.isArray(list) ||
					!list.length ||
					list.some((entry) => typeof entry !== "string" || !entry))
			);
		})
	) {
		await badRequest(route, "Invalid Assignment");
		return true;
	}
	const selection = body as {
		blockIds?: Array<string>;
		storeyIds?: Array<string>;
		unitTypeIds?: Array<string>;
	};
	const known = {
		blockIds: project.blocks.map((block) => block.id),
		storeyIds: project.blocks
			.flatMap((block) => block.storeys)
			.map((storey) => storey.id),
		unitTypeIds: project.unitTypes.map((type) => type.id),
	};
	if (
		!project.catalogueItems?.some((entry) => entry.id === catalogueItemId) ||
		lists.some((key) =>
			selection[key]?.some((entry) => !known[key].includes(entry))
		)
	) {
		await notFound(route, "Not found in this Project");
		return true;
	}
	let assigned = 0;
	let skipped = 0;
	for (const unit of selectedUnits(project, selection))
		for (const item of unit.items ?? []) {
			if (item.catalogueItemId !== catalogueItemId) continue;
			const current = item.subcontractorId ?? null;
			const changes =
				target === null
					? current !== null
					: current === null || (reassign === true && current !== target);
			if (changes) {
				item.subcontractorId = target;
				assigned += 1;
			} else skipped += 1;
		}
	await route.fulfill({
		json: { data: fullProject(project), meta: { assigned, skipped } },
	});
	return true;
};
