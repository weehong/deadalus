import { handleUnits } from "./units-api";
import { handleStructure } from "./structure-api";
import { handleUnitTypes } from "./unit-types-api";
import {
	fullProject,
	handleApplyCatalogueItem,
	handleCatalogueItems,
	handleRemoveCatalogueItem,
	type FakeCatalogueItem,
	type FakeItem,
} from "./catalogue-items-api";
import { unitMatrixFixture } from "./unit-matrix-api";
import { handleAssignments } from "./assignments-api";
import { handleProgressEntries } from "./progress-entries-api";
import {
	directoryFixtures,
	type FakeSubcontractor,
} from "./subcontractors-api";
import type { Page } from "@playwright/test";

export interface FakeUnit {
	id: string;
	name: string;
	position: number;
	unitTypeId: string | null;
	/** Items this Unit holds; absent means none. */
	items?: Array<FakeItem>;
}
export interface FakeStorey {
	id: string;
	name: string;
	position: number;
	units: Array<FakeUnit>;
}
export interface FakeBlock {
	id: string;
	name: string;
	position: number;
	storeys: Array<FakeStorey>;
}
export interface FakeUnitType {
	id: string;
	code: string;
	description: string | null;
}
export interface FakeProject {
	id: string;
	code: string;
	name: string;
	blocks: Array<FakeBlock>;
	unitTypes: Array<FakeUnitType>;
	/** The Item Catalogue; absent means empty. */
	catalogueItems?: Array<FakeCatalogueItem>;
}

export const projectFixtures = (): Array<FakeProject> =>
	Array.from({ length: 21 }, (_, index) => ({
		id: `project-${index + 1}`,
		code: `P${String(index + 1).padStart(2, "0")}`,
		name: `Project ${String(index + 1).padStart(2, "0")}`,
		blocks: [
			{
				id: `block-${index + 1}`,
				name: "A",
				position: 1,
				storeys: [
					{
						id: `storey-${index + 1}`,
						name: "01",
						position: 1,
						units: [
							{
								id: `unit-${index + 1}`,
								name: "01",
								position: 1,
								unitTypeId: null,
							},
						],
					},
				],
			},
		],
		unitTypes: [],
	}));

// This fake independently implements the browser API contract, never backend internals.
export const interceptProjects = async (
	page: Page,
	records: Array<FakeProject> = projectFixtures(),
	/** The Directory the Assignment routes resolve Subcontractors against. */
	directory: Array<FakeSubcontractor> = directoryFixtures()
): Promise<void> => {
	await page.route("**/api/v1/projects**", async (route) => {
		const request = route.request();
		const url = new URL(request.url());
		if (request.headers()["authorization"] !== "Bearer e2e-access-token") {
			await route.fulfill({
				status: 401,
				json: { error: { code: "UNAUTHORIZED", message: "Missing Session" } },
			});
			return;
		}

		if (await handleUnits(route, records)) return;
		const storeyAddPath =
			/^\/api\/v1\/projects\/([^/]+)\/blocks\/([^/]+)\/storeys$/.exec(
				url.pathname
			);
		const storeyPath = /^\/api\/v1\/projects\/([^/]+)\/storeys\/([^/]+)$/.exec(
			url.pathname
		);
		const scopedStoreyPath = storeyAddPath ?? storeyPath;
		if (scopedStoreyPath) {
			const project = records.find(
				(entry) => entry.id === decodeURIComponent(scopedStoreyPath[1]!)
			);
			const block = storeyAddPath
				? project?.blocks.find(
						(entry) => entry.id === decodeURIComponent(storeyAddPath[2]!)
					)
				: project?.blocks.find((entry) =>
						entry.storeys.some(
							(storey) => storey.id === decodeURIComponent(storeyPath![2]!)
						)
					);
			const storey = storeyPath
				? block?.storeys.find(
						(entry) => entry.id === decodeURIComponent(storeyPath[2]!)
					)
				: undefined;
			if (!project || !block || (storeyPath && !storey)) {
				await route.fulfill({
					status: 404,
					json: {
						error: { code: "NOT_FOUND", message: "Storey or Block not found" },
					},
				});
				return;
			}
			const key = (name: string): string =>
				name.trim().replace(/\s+/g, " ").toLowerCase();
			if (request.method() === "DELETE" && storey) {
				block.storeys = block.storeys.filter((entry) => entry.id !== storey.id);
				await route.fulfill({ status: 204 });
				return;
			}
			const input = request.postDataJSON() as {
				names?: unknown;
				name?: unknown;
			};
			const raw = request.method() === "POST" ? input.names : [input.name];
			if (
				!Array.isArray(raw) ||
				!raw.length ||
				raw.length > 500 ||
				raw.some(
					(name) =>
						typeof name !== "string" || !name.trim() || name.trim().length > 60
				)
			) {
				await route.fulfill({
					status: 400,
					json: { error: { code: "BAD_REQUEST", message: "Invalid names" } },
				});
				return;
			}
			const names = (raw as Array<string>).map((name) => name.trim());
			if (new Set(names.map(key)).size !== names.length) {
				await route.fulfill({
					status: 400,
					json: { error: { code: "BAD_REQUEST", message: "Repeated names" } },
				});
				return;
			}
			const clashes = names.filter((name) =>
				block.storeys.some(
					(entry) => entry.id !== storey?.id && key(entry.name) === key(name)
				)
			);
			if (clashes.length) {
				await route.fulfill({
					status: 409,
					json: {
						error: {
							code: "STOREY_NAME_TAKEN",
							message: "Names already exist",
							details: { names: clashes },
						},
					},
				});
				return;
			}
			if (request.method() === "PATCH" && storey) storey.name = names[0]!;
			else if (request.method() === "POST" && storeyAddPath) {
				const start =
					Math.max(-1, ...block.storeys.map((entry) => entry.position)) + 1;
				block.storeys.push(
					...names.map((name, index) => ({
						id: `storey-${crypto.randomUUID()}`,
						name,
						position: start + index,
						units: [],
					}))
				);
			} else {
				await route.fulfill({ status: 404 });
				return;
			}
			await route.fulfill({
				status: request.method() === "POST" ? 201 : 200,
				json: { data: fullProject(project) },
			});
			return;
		}
		const blockPath =
			/^\/api\/v1\/projects\/([^/]+)\/blocks(?:\/([^/]+))?$/.exec(url.pathname);
		if (blockPath) {
			const project = records.find(
				(entry) => entry.id === decodeURIComponent(blockPath[1]!)
			);
			const block = project?.blocks.find(
				(entry) => entry.id === decodeURIComponent(blockPath[2] ?? "")
			);
			if (!project || (blockPath[2] && !block)) {
				await route.fulfill({
					status: 404,
					json: {
						error: { code: "NOT_FOUND", message: "Block or Project not found" },
					},
				});
				return;
			}
			const key = (name: string): string =>
				name.trim().replace(/\s+/g, " ").toLowerCase();
			if (request.method() === "DELETE" && block) {
				project.blocks = project.blocks.filter(
					(entry) => entry.id !== block.id
				);
				await route.fulfill({ status: 204 });
				return;
			}
			const input = request.postDataJSON() as {
				names?: unknown;
				name?: unknown;
			};
			const raw = request.method() === "POST" ? input.names : [input.name];
			if (
				!Array.isArray(raw) ||
				!raw.length ||
				raw.length > 500 ||
				raw.some(
					(name) =>
						typeof name !== "string" || !name.trim() || name.trim().length > 60
				)
			) {
				await route.fulfill({
					status: 400,
					json: { error: { code: "BAD_REQUEST", message: "Invalid names" } },
				});
				return;
			}
			const names = (raw as Array<string>).map((name) => name.trim());
			if (new Set(names.map(key)).size !== names.length) {
				await route.fulfill({
					status: 400,
					json: { error: { code: "BAD_REQUEST", message: "Repeated names" } },
				});
				return;
			}
			const clashes = names.filter((name) =>
				project.blocks.some(
					(entry) => entry.id !== block?.id && key(entry.name) === key(name)
				)
			);
			if (clashes.length) {
				await route.fulfill({
					status: 409,
					json: {
						error: {
							code: "BLOCK_NAME_TAKEN",
							message: "Names already exist",
							details: { names: clashes },
						},
					},
				});
				return;
			}
			if (request.method() === "PATCH" && block) block.name = names[0]!;
			else if (request.method() === "POST" && !block) {
				const start =
					Math.max(-1, ...project.blocks.map((entry) => entry.position)) + 1;
				project.blocks.push(
					...names.map((name, index) => ({
						id: `block-${crypto.randomUUID()}`,
						name,
						position: start + index,
						storeys: [],
					}))
				);
			} else {
				await route.fulfill({ status: 404 });
				return;
			}
			await route.fulfill({
				status: request.method() === "POST" ? 201 : 200,
				json: { data: fullProject(project) },
			});
			return;
		}
		if (
			request.method() === "POST" &&
			/^\/api\/v1\/projects\/[^/]+\/unit-matrix\/parse$/.test(url.pathname)
		) {
			const record = records.find(
				(entry) => entry.id === decodeURIComponent(url.pathname.split("/")[4]!)
			);
			await route.fulfill(
				record
					? { json: { data: unitMatrixFixture() } }
					: {
							status: 404,
							json: {
								error: { code: "NOT_FOUND", message: "Project not found" },
							},
						}
			);
			return;
		}
		if (await handleStructure(route, records)) return;
		if (await handleUnitTypes(route, records)) return;
		if (await handleProgressEntries(route, records, directory)) return;
		if (await handleAssignments(route, records, directory)) return;
		if (await handleApplyCatalogueItem(route, records)) return;
		if (await handleRemoveCatalogueItem(route, records)) return;
		if (await handleCatalogueItems(route, records)) return;
		if (request.method() === "POST" && url.pathname === "/api/v1/projects") {
			const body: unknown = request.postDataJSON();
			const input = body as { name?: unknown; code?: unknown };
			const name = typeof input?.name === "string" ? input.name.trim() : "";
			const code =
				typeof input?.code === "string" ? input.code.trim().toUpperCase() : "";
			const fieldErrors: { name?: Array<string>; code?: Array<string> } = {};
			if (!name || name.length > 60) fieldErrors.name = ["Invalid name"];
			if (!/^[A-Z0-9-]{2,12}$/.test(code)) fieldErrors.code = ["Invalid code"];
			if (Object.keys(fieldErrors).length > 0) {
				await route.fulfill({
					status: 400,
					json: {
						error: {
							code: "BAD_REQUEST",
							message: "Invalid Project",
							details: { fieldErrors },
						},
					},
				});
				return;
			}
			const key = (value: string): string =>
				value.trim().replace(/\s+/g, " ").toLowerCase();
			const conflict = records.some((record) => key(record.name) === key(name))
				? "PROJECT_NAME_TAKEN"
				: records.some((record) => record.code === code)
					? "PROJECT_CODE_TAKEN"
					: undefined;
			if (conflict) {
				await route.fulfill({
					status: 409,
					json: { error: { code: conflict, message: "Already taken" } },
				});
				return;
			}
			const project = {
				id: `project-${crypto.randomUUID()}`,
				name,
				code,
				blocks: [],
				unitTypes: [],
			};
			records.push(project);
			await route.fulfill({
				status: 201,
				json: { data: fullProject(project) },
			});
			return;
		}
		if (request.method() === "GET" && url.pathname === "/api/v1/projects") {
			const currentPage = Number(url.searchParams.get("page") ?? 1);
			const pageSize = Math.min(
				100,
				Number(url.searchParams.get("pageSize") ?? 20)
			);
			const q = url.searchParams.get("q")?.trim().toLowerCase() ?? "";
			const key = (name: string): string =>
				name.trim().replace(/\s+/g, " ").toLowerCase();
			const sorted = records
				.filter(
					(record) =>
						record.name.toLowerCase().includes(q) ||
						record.code.toLowerCase().includes(q)
				)
				.sort(
					(left, right) =>
						key(left.name).localeCompare(key(right.name)) ||
						left.id.localeCompare(right.id)
				);
			await route.fulfill({
				json: {
					data: sorted
						.slice((currentPage - 1) * pageSize, currentPage * pageSize)
						.map((record) => ({
							id: record.id,
							code: record.code,
							name: record.name,
							itemCount: fullProject(record).itemCount,
							progression: fullProject(record).progression,
							blockCount: record.blocks.length,
							storeyCount: record.blocks.flatMap((block) => block.storeys)
								.length,
							unitCount: record.blocks
								.flatMap((block) => block.storeys)
								.flatMap((storey) => storey.units).length,
						})),
					meta: { page: currentPage, pageSize, total: sorted.length },
				},
			});
			return;
		}
		if (
			["GET", "PATCH", "DELETE"].includes(request.method()) &&
			/^\/api\/v1\/projects\/[^/]+$/.test(url.pathname)
		) {
			const record = records.find(
				(entry) => entry.id === decodeURIComponent(url.pathname.split("/")[4]!)
			);
			if (record) {
				if (request.method() === "DELETE") {
					records.splice(records.indexOf(record), 1);
					await route.fulfill({ status: 204 });
					return;
				}
				if (request.method() === "PATCH") {
					const input = request.postDataJSON() as {
						name?: unknown;
						code?: unknown;
					};
					const name =
						input.name === undefined
							? record.name
							: typeof input.name === "string"
								? input.name.trim()
								: "";
					const code =
						input.code === undefined
							? record.code
							: typeof input.code === "string"
								? input.code.trim().toUpperCase()
								: "";
					if (
						(input.name === undefined && input.code === undefined) ||
						!name ||
						name.length > 60 ||
						!/^[A-Z0-9-]{2,12}$/.test(code)
					) {
						await route.fulfill({
							status: 400,
							json: {
								error: { code: "BAD_REQUEST", message: "Invalid Project" },
							},
						});
						return;
					}
					const key = (value: string): string =>
						value.trim().replace(/\s+/g, " ").toLowerCase();
					const others = records.filter((entry) => entry.id !== record.id);
					const conflict = others.some((entry) => key(entry.name) === key(name))
						? "PROJECT_NAME_TAKEN"
						: others.some((entry) => entry.code === code)
							? "PROJECT_CODE_TAKEN"
							: undefined;
					if (conflict) {
						await route.fulfill({
							status: 409,
							json: { error: { code: conflict, message: "Already taken" } },
						});
						return;
					}
					record.name = name;
					record.code = code;
				}
				await route.fulfill({ json: { data: fullProject(record) } });
				return;
			}
		}
		await route.fulfill({
			status: 404,
			json: { error: { code: "NOT_FOUND", message: "Not found" } },
		});
	});
};
