import type { Route } from "@playwright/test";
import { nameKey, rollUp } from "./fake-shared";
import type { FakeProject, FakeUnit } from "./projects-api";
import type { Project } from "../src/features/projects/types";

// The browser-edge fake of the Item Catalogue routes and of the full Project
// read's roll-ups. It implements the API contract only, never backend internals.
export interface FakeCatalogueItem {
	id: string;
	name: string;
}
/** One Progress entry as the API answers it; never changed once made. */
export interface FakeEntry {
	id: string;
	value: number;
	note: string | null;
	enteredByKind: "administrator" | "member";
	enteredByName: string;
	subcontractorName: string | null;
	createdAt: string;
}
export interface FakeItem {
	catalogueItemId: string;
	/** The Item's Assignment; absent means none. */
	subcontractorId?: string | null;
	progression: number;
	/** The roll-ups' count of entries; a fixture may set it without listing them. */
	entryCount: number;
	/** The Item's history; absent means none. Entering progress appends here and bumps `entryCount`. */
	entries?: Array<FakeEntry>;
}
export const newestFirst = (entries: Array<FakeEntry>): Array<FakeEntry> =>
	[...entries].sort(
		(a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id)
	);
/** The Unit's Items read summarises the latest entry by createdAt then id, or null. */
export const latestEntryOf = (
	item: FakeItem
): {
	value: number;
	note: string | null;
	enteredByName: string;
	createdAt: string;
} | null => {
	const [latest] = newestFirst(item.entries ?? []);
	return latest
		? {
				value: latest.value,
				note: latest.note,
				enteredByName: latest.enteredByName,
				createdAt: latest.createdAt,
			}
		: null;
};
const codeKey = (code: string): string => code.replace(/\s/g, "").toUpperCase();
const ordered = <T extends { id: string; position: number }>(
	rows: Array<T>
): Array<T> =>
	[...rows].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
const unitItems = (unit: FakeUnit): Array<FakeItem> => unit.items ?? [];
/** The full Project read: ordered Structure, Unit Types, Catalogue Items and roll-ups. */
export const fullProject = (project: FakeProject): Project => {
	const units = project.blocks
		.flatMap((block) => block.storeys)
		.flatMap((storey) => storey.units);
	return {
		id: project.id,
		code: project.code,
		name: project.name,
		...rollUp(units.flatMap(unitItems)),
		blocks: ordered(project.blocks).map((block) => ({
			id: block.id,
			name: block.name,
			position: block.position,
			...rollUp(
				block.storeys.flatMap((storey) => storey.units).flatMap(unitItems)
			),
			storeys: ordered(block.storeys).map((storey) => ({
				id: storey.id,
				name: storey.name,
				position: storey.position,
				...rollUp(storey.units.flatMap(unitItems)),
				units: ordered(storey.units).map((unit) => ({
					id: unit.id,
					name: unit.name,
					position: unit.position,
					unitTypeId: unit.unitTypeId,
					...rollUp(unitItems(unit)),
					items: [...unitItems(unit)]
						.sort((a, b) => a.catalogueItemId.localeCompare(b.catalogueItemId))
						.map((item) => ({
							catalogueItemId: item.catalogueItemId,
							subcontractorId: item.subcontractorId ?? null,
							entryCount: item.entryCount,
						})),
				})),
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
		catalogueItems: [...(project.catalogueItems ?? [])]
			.sort(
				(a, b) =>
					nameKey(a.name).localeCompare(nameKey(b.name)) ||
					a.id.localeCompare(b.id)
			)
			.map((item) => ({
				...item,
				itemCount: units
					.flatMap(unitItems)
					.filter((held) => held.catalogueItemId === item.id).length,
			})),
	};
};
export const handleCatalogueItems = async (
	route: Route,
	records: Array<FakeProject>
): Promise<boolean> => {
	const request = route.request();
	const match =
		/^\/api\/v1\/projects\/([^/]+)\/catalogue-items(?:\/([^/]+))?$/.exec(
			new URL(request.url()).pathname
		);
	if (!match) return false;
	const method = request.method();
	const project = records.find(
		(record) => record.id === decodeURIComponent(match[1]!)
	);
	const id = match[2] ? decodeURIComponent(match[2]) : undefined;
	const catalogue = project ? (project.catalogueItems ??= []) : [];
	const item = catalogue.find((entry) => entry.id === id);
	if (
		!project ||
		(method !== "POST" && !item) ||
		(method === "POST" && id) ||
		!["POST", "PATCH", "DELETE"].includes(method)
	) {
		await route.fulfill({
			status: 404,
			json: {
				error: {
					code: "NOT_FOUND",
					message: "Catalogue Item or Project not found",
				},
			},
		});
		return true;
	}
	if (method === "DELETE" && item) {
		const itemCount = project.blocks
			.flatMap((block) => block.storeys)
			.flatMap((storey) => storey.units)
			.flatMap(unitItems)
			.filter((held) => held.catalogueItemId === id).length;
		if (itemCount)
			await route.fulfill({
				status: 409,
				json: {
					error: {
						code: "CATALOGUE_ITEM_IN_USE",
						message: "Units still hold Items made from this Catalogue Item",
						details: { itemCount },
					},
				},
			});
		else {
			project.catalogueItems = catalogue.filter((entry) => entry.id !== id);
			await route.fulfill({ status: 204 });
		}
		return true;
	}
	const input = request.postDataJSON() as { name?: unknown };
	const name = typeof input?.name === "string" ? input.name.trim() : "";
	if (!name || name.length > 60) {
		await route.fulfill({
			status: 400,
			json: {
				error: {
					code: "BAD_REQUEST",
					message: "Invalid Catalogue Item",
					details: { fieldErrors: { name: ["Invalid name"] } },
				},
			},
		});
		return true;
	}
	if (
		catalogue.some(
			(entry) => entry.id !== id && nameKey(entry.name) === nameKey(name)
		)
	) {
		await route.fulfill({
			status: 409,
			json: {
				error: { code: "CATALOGUE_ITEM_NAME_TAKEN", message: "Already taken" },
			},
		});
		return true;
	}
	if (method === "POST")
		catalogue.push({ id: `catalogue-${crypto.randomUUID()}`, name });
	else if (item) item.name = name;
	await route.fulfill({
		status: method === "POST" ? 201 : 200,
		json: { data: fullProject(project) },
	});
	return true;
};

const selectFakeUnits = (
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
interface FakeSelection {
	blockIds?: Array<string>;
	storeyIds?: Array<string>;
	unitTypeIds?: Array<string>;
}
/**
 * The selection routes' shared edge: 400 for an empty or malformed list and
 * 404 for a Project, Catalogue Item, Block, Storey or Unit Type outside the
 * Project, both already answered when this returns undefined.
 */
const resolveSelection = async (
	route: Route,
	records: Array<FakeProject>,
	match: RegExpExecArray
): Promise<
	{ project: FakeProject; id: string; units: Array<FakeUnit> } | undefined
> => {
	const request = route.request();
	const project = records.find(
		(record) => record.id === decodeURIComponent(match[1]!)
	);
	const id = decodeURIComponent(match[2]!);
	const catalogueItem = project?.catalogueItems?.find(
		(entry) => entry.id === id
	);
	const body = (request.postDataJSON() ?? {}) as Record<string, unknown>;
	const lists = ["blockIds", "storeyIds", "unitTypeIds"] as const;
	if (
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
		await route.fulfill({
			status: 400,
			json: { error: { code: "BAD_REQUEST", message: "Invalid selection" } },
		});
		return undefined;
	}
	const selection = body as FakeSelection;
	const known = project
		? {
				blockIds: project.blocks.map((block) => block.id),
				storeyIds: project.blocks
					.flatMap((block) => block.storeys)
					.map((storey) => storey.id),
				unitTypeIds: project.unitTypes.map((type) => type.id),
			}
		: undefined;
	if (
		!project ||
		!known ||
		!catalogueItem ||
		lists.some((key) =>
			selection[key]?.some((entry) => !known[key].includes(entry))
		)
	) {
		await route.fulfill({
			status: 404,
			json: {
				error: { code: "NOT_FOUND", message: "Not found in this Project" },
			},
		});
		return undefined;
	}
	return { project, id, units: selectFakeUnits(project, selection) };
};
/** The apply route: one Item in every selected Unit holding none, with the counts in `meta`. */
export const handleApplyCatalogueItem = async (
	route: Route,
	records: Array<FakeProject>
): Promise<boolean> => {
	const request = route.request();
	const match =
		/^\/api\/v1\/projects\/([^/]+)\/catalogue-items\/([^/]+)\/items$/.exec(
			new URL(request.url()).pathname
		);
	if (!match || request.method() !== "POST") return false;
	const resolved = await resolveSelection(route, records, match);
	if (!resolved) return true;
	const { project, id, units } = resolved;
	let added = 0;
	let skipped = 0;
	for (const unit of units) {
		const items = (unit.items ??= []);
		if (items.some((held) => held.catalogueItemId === id)) skipped += 1;
		else {
			items.push({ catalogueItemId: id, progression: 0, entryCount: 0 });
			added += 1;
		}
	}
	await route.fulfill({
		status: 201,
		json: { data: fullProject(project), meta: { added, skipped } },
	});
	return true;
};
/** The remove route: the Item made from the Catalogue Item goes from every selected Unit holding one, its entries with it. */
export const handleRemoveCatalogueItem = async (
	route: Route,
	records: Array<FakeProject>
): Promise<boolean> => {
	const request = route.request();
	const match =
		/^\/api\/v1\/projects\/([^/]+)\/catalogue-items\/([^/]+)\/items\/remove$/.exec(
			new URL(request.url()).pathname
		);
	if (!match || request.method() !== "POST") return false;
	const resolved = await resolveSelection(route, records, match);
	if (!resolved) return true;
	const { project, id, units } = resolved;
	let removed = 0;
	let entriesRemoved = 0;
	for (const unit of units) {
		const held = unit.items?.find((item) => item.catalogueItemId === id);
		if (!held) continue;
		removed += 1;
		entriesRemoved += held.entryCount;
		unit.items = unit.items?.filter((item) => item !== held);
	}
	await route.fulfill({
		status: 200,
		json: { data: fullProject(project), meta: { removed, entriesRemoved } },
	});
	return true;
};
