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
	item: { findMany: vi.fn(), createMany: vi.fn() },
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
const isProject = (id: string): id is "p1" | "p2" => id === "p1" || id === "p2";
beforeEach(() => {
	vi.clearAllMocks();
	items = [];
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
	db.item.createMany.mockImplementation(
		async ({
			data,
			skipDuplicates,
		}: {
			data: Array<{ unitId: string; catalogueItemId: string }>;
			skipDuplicates?: boolean;
		}) => {
			let count = 0;
			for (const row of data) {
				const held = items.some(
					(item) =>
						item.unitId === row.unitId &&
						item.catalogueItemId === row.catalogueItemId
				);
				if (held && !skipDuplicates) throw new Error("duplicate");
				if (held) continue;
				items.push({ ...row, progression: 0, entryCount: 0 });
				count += 1;
			}
			return { count };
		}
	);
});
const apply = (
	body: object,
	projectId = "p1",
	catalogueItemId = "cabinet"
): request.Test =>
	request(app)
		.post(
			`/api/v1/projects/${projectId}/catalogue-items/${catalogueItemId}/items`
		)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
const unitIds = (): Array<string> =>
	items
		.filter((item) => item.catalogueItemId === "cabinet")
		.map((i) => i.unitId);

it("applies to every Unit of the Project when no filter is given and returns the full Project", async () => {
	const response = await apply({});
	expect(response.status).toBe(201);
	expect(response.body.meta).toEqual({ added: 5, skipped: 0 });
	expect(unitIds()).toEqual(["u1", "u2", "u3", "u4", "u5"]);
	expect(transaction).toHaveBeenCalledOnce();
	expect(db.item.createMany).toHaveBeenCalledWith({
		data: ["u1", "u2", "u3", "u4", "u5"].map((unitId) => ({
			unitId,
			catalogueItemId: "cabinet",
		})),
		skipDuplicates: true,
	});
	const project = response.body.data;
	expect(project).toMatchObject({
		id: "p1",
		itemCount: 5,
		entryCount: 0,
		progression: 0,
		catalogueItems: [
			{ id: "cabinet", name: "Kitchen cabinet", itemCount: 5 },
			{ id: "sink", name: "Sink", itemCount: 0 },
		],
	});
	const [a, b, c] = project.blocks;
	expect(a).toMatchObject({ itemCount: 3, progression: 0 });
	expect(a.storeys[0]).toMatchObject({ itemCount: 2, progression: 0 });
	expect(a.storeys[0].units[0]).toMatchObject({ itemCount: 1, progression: 0 });
	expect(a.storeys[0].units[0].items).toEqual([
		{ catalogueItemId: "cabinet", subcontractorId: null, entryCount: 0 },
	]);
	expect(a.storeys[1]).toMatchObject({ itemCount: 1, progression: 0 });
	expect(b).toMatchObject({ itemCount: 2, progression: 0 });
	expect(c).toMatchObject({ itemCount: 0, progression: null });
});
it("applies to one Block", async () => {
	const response = await apply({ blockIds: ["b2"] });
	expect(response.status).toBe(201);
	expect(response.body.meta).toEqual({ added: 2, skipped: 0 });
	expect(unitIds()).toEqual(["u4", "u5"]);
	const [a, b] = response.body.data.blocks;
	expect(a).toMatchObject({ itemCount: 0, progression: null });
	expect(b).toMatchObject({ itemCount: 2, progression: 0 });
	expect(b.storeys[0].units[1]).toMatchObject({ itemCount: 1, progression: 0 });
});
it("applies to chosen Storeys of one Block", async () => {
	const response = await apply({ blockIds: ["b1"], storeyIds: ["s2"] });
	expect(response.status).toBe(201);
	expect(response.body.meta).toEqual({ added: 1, skipped: 0 });
	expect(unitIds()).toEqual(["u3"]);
	expect(response.body.data.blocks[0].storeys[0]).toMatchObject({
		itemCount: 0,
		progression: null,
	});
	expect(response.body.data.blocks[0].storeys[1]).toMatchObject({
		itemCount: 1,
		progression: 0,
	});
});
it("applies to Unit Types across Blocks, never to a Unit without a Unit Type", async () => {
	const response = await apply({ unitTypeIds: ["t2"] });
	expect(response.status).toBe(201);
	expect(response.body.meta).toEqual({ added: 2, skipped: 0 });
	expect(unitIds()).toEqual(["u2", "u4"]);
	expect(response.body.data.blocks[1].storeys[0].units[1]).toMatchObject({
		itemCount: 0,
		progression: null,
	});
});
it("applies to an empty Block of the Project without adding anything", async () => {
	const response = await apply({ blockIds: ["b3"] });
	expect(response.status).toBe(201);
	expect(response.body.meta).toEqual({ added: 0, skipped: 0 });
	expect(response.body.data.itemCount).toBe(0);
});
it("skips every Unit already holding the Item on a repeat apply", async () => {
	await apply({ blockIds: ["b1"], storeyIds: ["s1"] });
	const response = await apply({});
	expect(response.status).toBe(201);
	expect(response.body.meta).toEqual({ added: 3, skipped: 2 });
	expect(unitIds()).toEqual(["u1", "u2", "u3", "u4", "u5"]);
	const repeat = await apply({});
	expect(repeat.status).toBe(201);
	expect(repeat.body.meta).toEqual({ added: 0, skipped: 5 });
	expect(repeat.body.data.catalogueItems[0].itemCount).toBe(5);
	expect(items).toHaveLength(5);
});
it("keeps another Catalogue Item's Items apart", async () => {
	await apply({}, "p1", "sink");
	const response = await apply({ blockIds: ["b1"] });
	expect(response.body.meta).toEqual({ added: 3, skipped: 0 });
	expect(response.body.data.catalogueItems).toEqual([
		{ id: "cabinet", name: "Kitchen cabinet", itemCount: 3 },
		{ id: "sink", name: "Sink", itemCount: 5 },
	]);
	expect(response.body.data.blocks[0].storeys[0].units[0]).toMatchObject({
		itemCount: 2,
		progression: 0,
		items: [
			{ catalogueItemId: "cabinet", subcontractorId: null },
			{ catalogueItemId: "sink", subcontractorId: null },
		],
	});
	expect(response.body.data.blocks[1].storeys[0].units[0].items).toEqual([
		{ catalogueItemId: "sink", subcontractorId: null, entryCount: 0 },
	]);
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
		const response = await apply(body);
		expect(response.status).toBe(400);
		expect(transaction).not.toHaveBeenCalled();
		expect(db.item.createMany).not.toHaveBeenCalled();
	}
);
it.each([
	["Block", { blockIds: ["b1", "b9"] }],
	["Storey", { storeyIds: ["s9"] }],
	["Unit Type", { unitTypeIds: ["t1", "t9"] }],
	["unknown Block", { blockIds: ["missing"] }],
])(
	"answers 404 for a %s of another Project and writes nothing",
	async (_label, body) => {
		const response = await apply(body);
		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("NOT_FOUND");
		expect(db.item.createMany).not.toHaveBeenCalled();
	}
);
it("answers 404 for a Catalogue Item of another Project or an unknown Project", async () => {
	expect((await apply({}, "p1", "other-1")).status).toBe(404);
	expect((await apply({}, "p2", "cabinet")).status).toBe(404);
	expect((await apply({}, "missing", "cabinet")).status).toBe(404);
	expect(db.item.createMany).not.toHaveBeenCalled();
});
it("requires a verified Session", async () => {
	const response = await request(app)
		.post("/api/v1/projects/p1/catalogue-items/cabinet/items")
		.send({});
	expect(response.status).toBe(401);
});
it("documents the apply route with its counts", async () => {
	const response = await request(app).get("/openapi.json");
	const operation =
		response.body.paths[
			"/api/v1/projects/{id}/catalogue-items/{catalogueItemId}/items"
		]?.post;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	for (const code of [201, 400, 401, 404])
		expect(operation.responses).toHaveProperty(String(code));
	const schema = operation.responses["201"].content["application/json"].schema;
	expect(schema.properties.meta.properties).toHaveProperty("added");
	expect(schema.properties.meta.properties).toHaveProperty("skipped");
	const unit =
		response.body.components.schemas.Project.properties.blocks.items.properties
			.storeys.items.properties.units.items;
	expect(unit.properties.items.items.properties).toHaveProperty(
		"catalogueItemId"
	);
	expect(unit.properties.items.items.properties).toHaveProperty(
		"subcontractorId"
	);
});
