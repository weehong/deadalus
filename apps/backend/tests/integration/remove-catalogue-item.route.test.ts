import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

interface ItemRow {
	unitId: string;
	catalogueItemId: string;
	progression: number;
	entryCount: number;
}
let items: Array<ItemRow>;
const db = {
	project: { findUnique: vi.fn() },
	catalogueItem: { findFirst: vi.fn() },
	block: { findMany: vi.fn() },
	unitType: { findMany: vi.fn() },
	item: { findMany: vi.fn(), deleteMany: vi.fn() },
	progressEntry: { count: vi.fn() },
};
const transaction = vi.fn(async (work) => work(db));
vi.mock("@/lib/prisma.js", () => ({
	prisma: { ...db, $transaction: transaction },
}));
let app: import("express").Application;
let token: string;
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	app = (await import("@/app.js")).createApp();
});
afterAll(() => vi.unstubAllGlobals());

// Project p1: Block A (Storey 01: u1 t1, u2 t2; Storey 02: u3 t1), Block B
// (Storey 01: u4 t2, u5 untyped) and an empty Block C. Project p2 owns b9,
// s9, t9 and the Catalogue Item other-1.
const structure = {
	p1: [
		{
			id: "b1",
			name: "A",
			position: 0,
			storeys: [
				{
					id: "s1",
					name: "01",
					position: 0,
					units: [
						{ id: "u1", name: "01", position: 0, unitTypeId: "t1" },
						{ id: "u2", name: "02", position: 1, unitTypeId: "t2" },
					],
				},
				{
					id: "s2",
					name: "02",
					position: 1,
					units: [{ id: "u3", name: "01", position: 0, unitTypeId: "t1" }],
				},
			],
		},
		{
			id: "b2",
			name: "B",
			position: 1,
			storeys: [
				{
					id: "s3",
					name: "01",
					position: 0,
					units: [
						{ id: "u4", name: "01", position: 0, unitTypeId: "t2" },
						{ id: "u5", name: "02", position: 1, unitTypeId: null },
					],
				},
			],
		},
		{ id: "b3", name: "C", position: 2, storeys: [] },
	],
	p2: [
		{
			id: "b9",
			name: "Z",
			position: 0,
			storeys: [
				{
					id: "s9",
					name: "01",
					position: 0,
					units: [{ id: "u9", name: "01", position: 0, unitTypeId: "t9" }],
				},
			],
		},
	],
};
const unitTypes = {
	p1: [
		{ id: "t1", code: "AS1", description: null },
		{ id: "t2", code: "BP2", description: null },
	],
	p2: [{ id: "t9", code: "CP7", description: null }],
};
const catalogue = [
	{ id: "cabinet", projectId: "p1", name: "Kitchen cabinet" },
	{ id: "sink", projectId: "p1", name: "Sink" },
	{ id: "other-1", projectId: "p2", name: "Wardrobe" },
];
// Cabinet in every Unit of Block A and in u4, with entries in u1, u2 and u4;
// Sink in u1 and u4 with its own entries.
const seeded = (): Array<ItemRow> => [
	{ unitId: "u1", catalogueItemId: "cabinet", progression: 50, entryCount: 2 },
	{ unitId: "u2", catalogueItemId: "cabinet", progression: 100, entryCount: 3 },
	{ unitId: "u3", catalogueItemId: "cabinet", progression: 0, entryCount: 0 },
	{ unitId: "u4", catalogueItemId: "cabinet", progression: 20, entryCount: 1 },
	{ unitId: "u1", catalogueItemId: "sink", progression: 10, entryCount: 4 },
	{ unitId: "u4", catalogueItemId: "sink", progression: 0, entryCount: 0 },
];
const isProject = (id: string): id is "p1" | "p2" => id === "p1" || id === "p2";
interface ItemWhere {
	catalogueItemId: string;
	unitId: { in: Array<string> };
}
const matches =
	(where: ItemWhere) =>
	(item: ItemRow): boolean =>
		item.catalogueItemId === where.catalogueItemId &&
		where.unitId.in.includes(item.unitId);
beforeEach(() => {
	vi.clearAllMocks();
	items = seeded();
	db.project.findUnique.mockImplementation(
		async ({ where }: { where: { id: string } }) =>
			isProject(where.id)
				? {
						id: where.id,
						name: "Gardens",
						code: "EG2",
						blocks: structure[where.id],
						unitTypes: unitTypes[where.id].map((type) => ({
							...type,
							_count: { units: 0 },
						})),
						catalogueItems: catalogue
							.filter((entry) => entry.projectId === where.id)
							.map(({ id, name }) => ({
								id,
								name,
								_count: {
									items: items.filter((item) => item.catalogueItemId === id)
										.length,
								},
							})),
					}
				: null
	);
	db.catalogueItem.findFirst.mockImplementation(
		async ({ where }: { where: { id: string; projectId: string } }) =>
			catalogue.find(
				(entry) => entry.id === where.id && entry.projectId === where.projectId
			) ?? null
	);
	db.block.findMany.mockImplementation(
		async ({ where }: { where: { projectId: string } }) =>
			isProject(where.projectId)
				? structure[where.projectId].map((block) => ({
						id: block.id,
						storeys: block.storeys.map((storey) => ({
							id: storey.id,
							units: storey.units.map(({ id, unitTypeId }) => ({
								id,
								unitTypeId,
							})),
						})),
					}))
				: []
	);
	db.unitType.findMany.mockImplementation(
		async ({ where }: { where: { projectId: string } }) =>
			isProject(where.projectId)
				? unitTypes[where.projectId].map(({ id }) => ({ id }))
				: []
	);
	db.item.findMany.mockImplementation(async () =>
		items.map(({ unitId, catalogueItemId, progression, entryCount }) => ({
			unitId,
			catalogueItemId,
			subcontractorId: null,
			progression,
			_count: { entries: entryCount },
		}))
	);
	db.progressEntry.count.mockImplementation(
		async ({ where }: { where: { item: ItemWhere } }) =>
			items
				.filter(matches(where.item))
				.reduce((sum, item) => sum + item.entryCount, 0)
	);
	db.item.deleteMany.mockImplementation(
		async ({ where }: { where: ItemWhere }) => {
			const count = items.filter(matches(where)).length;
			items = items.filter((item) => !matches(where)(item));
			return { count };
		}
	);
});
const remove = (
	body: object,
	projectId = "p1",
	catalogueItemId = "cabinet"
): request.Test =>
	request(app)
		.post(
			`/api/v1/projects/${projectId}/catalogue-items/${catalogueItemId}/items/remove`
		)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
const unitIds = (catalogueItemId = "cabinet"): Array<string> =>
	items
		.filter((item) => item.catalogueItemId === catalogueItemId)
		.map((item) => item.unitId);

it("removes the Items from every Unit of the Project when no filter is given, entries counted before the delete", async () => {
	const response = await remove({});
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ removed: 4, entriesRemoved: 6 });
	expect(unitIds()).toEqual([]);
	expect(unitIds("sink")).toEqual(["u1", "u4"]);
	expect(transaction).toHaveBeenCalledOnce();
	const where = {
		catalogueItemId: "cabinet",
		unitId: { in: ["u1", "u2", "u3", "u4", "u5"] },
	};
	expect(db.progressEntry.count).toHaveBeenCalledWith({
		where: { item: where },
	});
	expect(db.item.deleteMany).toHaveBeenCalledWith({ where });
	expect(db.progressEntry.count.mock.invocationCallOrder[0]).toBeLessThan(
		db.item.deleteMany.mock.invocationCallOrder[0]!
	);
	const project = response.body.data;
	expect(project).toMatchObject({
		id: "p1",
		itemCount: 2,
		entryCount: 4,
		progression: 5,
		catalogueItems: [
			{ id: "cabinet", name: "Kitchen cabinet", itemCount: 0 },
			{ id: "sink", name: "Sink", itemCount: 2 },
		],
	});
	const [a, b, c] = project.blocks;
	expect(a).toMatchObject({ itemCount: 1, entryCount: 4, progression: 10 });
	expect(a.storeys[0].units[0]).toMatchObject({
		itemCount: 1,
		entryCount: 4,
		progression: 10,
		items: [{ catalogueItemId: "sink", subcontractorId: null }],
	});
	expect(a.storeys[0].units[1]).toMatchObject({
		itemCount: 0,
		entryCount: 0,
		progression: null,
		items: [],
	});
	expect(a.storeys[1]).toMatchObject({ itemCount: 0, progression: null });
	expect(b).toMatchObject({ itemCount: 1, entryCount: 0, progression: 0 });
	expect(c).toMatchObject({ itemCount: 0, progression: null });
});
it("removes from one Block", async () => {
	const response = await remove({ blockIds: ["b1"] });
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ removed: 3, entriesRemoved: 5 });
	expect(unitIds()).toEqual(["u4"]);
	const [a, b] = response.body.data.blocks;
	expect(a).toMatchObject({ itemCount: 1, entryCount: 4, progression: 10 });
	expect(b).toMatchObject({ itemCount: 2, entryCount: 1, progression: 10 });
});
it("removes from chosen Storeys of one Block", async () => {
	const response = await remove({ blockIds: ["b1"], storeyIds: ["s1"] });
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ removed: 2, entriesRemoved: 5 });
	expect(unitIds()).toEqual(["u3", "u4"]);
	expect(response.body.data.blocks[0].storeys[1]).toMatchObject({
		itemCount: 1,
		entryCount: 0,
		progression: 0,
	});
});
it("removes from Unit Types across Blocks, never from a Unit without a Unit Type", async () => {
	items.push({
		unitId: "u5",
		catalogueItemId: "cabinet",
		progression: 0,
		entryCount: 1,
	});
	const response = await remove({ unitTypeIds: ["t2"] });
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ removed: 2, entriesRemoved: 4 });
	expect(unitIds()).toEqual(["u1", "u3", "u5"]);
	expect(response.body.data.blocks[1].storeys[0].units[1]).toMatchObject({
		itemCount: 1,
		entryCount: 1,
	});
});
it.each([
	["an empty Block", { blockIds: ["b3"] }],
	["a Storey holding none of the Item", { storeyIds: ["s3"], unitTypeIds: ["t1"] }],
])(
	"returns zeros for a selection holding no Items: %s",
	async (_label, body) => {
		const response = await remove(body);
		expect(response.status).toBe(200);
		expect(response.body.meta).toEqual({ removed: 0, entriesRemoved: 0 });
		expect(items).toEqual(seeded());
		expect(response.body.data.catalogueItems[0].itemCount).toBe(4);
	}
);
it("returns zeros for a Catalogue Item applied nowhere", async () => {
	items = items.filter((item) => item.catalogueItemId !== "sink");
	const response = await remove({}, "p1", "sink");
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ removed: 0, entriesRemoved: 0 });
	expect(unitIds()).toEqual(["u1", "u2", "u3", "u4"]);
});
it("keeps another Catalogue Item's Items and entries", async () => {
	const response = await remove({}, "p1", "sink");
	expect(response.body.meta).toEqual({ removed: 2, entriesRemoved: 4 });
	expect(unitIds()).toEqual(["u1", "u2", "u3", "u4"]);
	expect(response.body.data).toMatchObject({
		itemCount: 4,
		entryCount: 6,
		catalogueItems: [
			{ id: "cabinet", itemCount: 4 },
			{ id: "sink", itemCount: 0 },
		],
	});
});
it.each([
	{ blockIds: [] },
	{ storeyIds: [] },
	{ unitTypeIds: [] },
	{ blockIds: "b1" },
	{ blockIds: [""] },
	{ storeyIds: [3] },
])(
	"rejects an empty or malformed filter before any write: %j",
	async (body) => {
		const response = await remove(body);
		expect(response.status).toBe(400);
		expect(transaction).not.toHaveBeenCalled();
		expect(db.item.deleteMany).not.toHaveBeenCalled();
	}
);
it.each([
	["Block", { blockIds: ["b1", "b9"] }],
	["Storey", { storeyIds: ["s9"] }],
	["Unit Type", { unitTypeIds: ["t1", "t9"] }],
	["unknown Block", { blockIds: ["missing"] }],
])(
	"answers 404 for a %s of another Project and deletes nothing",
	async (_label, body) => {
		const response = await remove(body);
		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("NOT_FOUND");
		expect(db.item.deleteMany).not.toHaveBeenCalled();
		expect(items).toEqual(seeded());
	}
);
it("answers 404 for a Catalogue Item of another Project or an unknown Project", async () => {
	expect((await remove({}, "p1", "other-1")).status).toBe(404);
	expect((await remove({}, "p2", "cabinet")).status).toBe(404);
	expect((await remove({}, "missing", "cabinet")).status).toBe(404);
	expect(db.item.deleteMany).not.toHaveBeenCalled();
});
it("requires a verified Session", async () => {
	const response = await request(app)
		.post("/api/v1/projects/p1/catalogue-items/cabinet/items/remove")
		.send({});
	expect(response.status).toBe(401);
	expect(transaction).not.toHaveBeenCalled();
});
it("documents the remove route with its counts", async () => {
	const response = await request(app).get("/openapi.json");
	const operation =
		response.body.paths[
			"/api/v1/projects/{id}/catalogue-items/{catalogueItemId}/items/remove"
		]?.post;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	for (const code of [200, 400, 401, 404])
		expect(operation.responses).toHaveProperty(String(code));
	const schema = operation.responses["200"].content["application/json"].schema;
	expect(schema.properties.meta.properties).toHaveProperty("removed");
	expect(schema.properties.meta.properties).toHaveProperty("entriesRemoved");
});
