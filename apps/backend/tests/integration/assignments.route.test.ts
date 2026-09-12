import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

interface ItemRow {
	id: string;
	unitId: string;
	catalogueItemId: string;
	subcontractorId: string | null;
	assignedAt: Date | null;
	progression: number;
	entryCount: number;
}
let items: Array<ItemRow>;
const db = {
	project: { findUnique: vi.fn() },
	catalogueItem: { findFirst: vi.fn() },
	subcontractor: { findUnique: vi.fn() },
	block: { findMany: vi.fn() },
	unitType: { findMany: vi.fn() },
	unit: { findFirst: vi.fn() },
	item: {
		findMany: vi.fn(),
		findFirst: vi.fn(),
		update: vi.fn(),
		updateMany: vi.fn(),
	},
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
// s9, u9, t9 and the Catalogue Item other-1. Directory: acme and bolt.
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
const directory = [
	{ id: "acme", name: "Acme Fitout" },
	{ id: "bolt", name: "Bolt Electrical" },
];
const isProject = (id: string): id is "p1" | "p2" => id === "p1" || id === "p2";
const projectOfUnit = (unitId: string): "p1" | "p2" | undefined =>
	(["p1", "p2"] as const).find((projectId) =>
		structure[projectId].some((block) =>
			block.storeys.some((storey) =>
				storey.units.some((unit) => unit.id === unitId)
			)
		)
	);
/** Seed one Item per Unit for the Catalogue Item, assigned as given. */
const seed = (
	assignments: Record<string, string | null>,
	catalogueItemId = "cabinet",
	progression = 40
): void => {
	for (const [unitId, subcontractorId] of Object.entries(assignments))
		items.push({
			id: `${unitId}-${catalogueItemId}`,
			unitId,
			catalogueItemId,
			subcontractorId,
			assignedAt: subcontractorId ? new Date("2026-09-01T00:00:00Z") : null,
			progression,
			entryCount: 2,
		});
};
const fullRow = (
	item: ItemRow
): ItemRow & {
	_count: { entries: number };
	/** No fixture Item has an entry; the Unit's Items read gets an empty relation. */
	entries: Array<never>;
	catalogueItem: { name: string; nameKey: string };
	subcontractor: { id: string; name: string } | null;
} => {
	const catalogueItem = catalogue.find(
		(entry) => entry.id === item.catalogueItemId
	)!;
	return {
		...item,
		_count: { entries: item.entryCount },
		entries: [],
		catalogueItem: {
			name: catalogueItem.name,
			nameKey: catalogueItem.name.toLowerCase(),
		},
		subcontractor:
			directory.find((entry) => entry.id === item.subcontractorId) ?? null,
	};
};
interface ItemWhere {
	id?: string | { in: Array<string> };
	unitId?: string | { in: Array<string> };
	catalogueItemId?: string;
	unit?: { storey: { block: { projectId: string } } };
}
const matches = (item: ItemRow, where: ItemWhere): boolean =>
	(where.id === undefined ||
		(typeof where.id === "string"
			? item.id === where.id
			: where.id.in.includes(item.id))) &&
	(where.unitId === undefined ||
		(typeof where.unitId === "string"
			? item.unitId === where.unitId
			: where.unitId.in.includes(item.unitId))) &&
	(where.catalogueItemId === undefined ||
		item.catalogueItemId === where.catalogueItemId) &&
	(where.unit === undefined ||
		projectOfUnit(item.unitId) === where.unit.storey.block.projectId);
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
	db.subcontractor.findUnique.mockImplementation(
		async ({ where }: { where: { id: string } }) =>
			directory.find((entry) => entry.id === where.id) ?? null
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
	db.unit.findFirst.mockImplementation(
		async ({
			where,
		}: {
			where: { id: string; storey: { block: { projectId: string } } };
		}) =>
			projectOfUnit(where.id) === where.storey.block.projectId
				? { id: where.id }
				: null
	);
	// A faithful stand-in: filters by the where given and honours the one
	// relation order the Unit's Items read asks for.
	db.item.findMany.mockImplementation(
		async ({
			where,
			orderBy,
		}: {
			where: ItemWhere;
			orderBy?: Array<Record<string, unknown>>;
		}) => {
			const rows = items.filter((item) => matches(item, where)).map(fullRow);
			if (
				orderBy?.some(
					(order) =>
						typeof order["catalogueItem"] === "object" &&
						order["catalogueItem"] !== null &&
						"nameKey" in order["catalogueItem"]
				)
			)
				rows.sort(
					(a, b) =>
						a.catalogueItem.nameKey.localeCompare(b.catalogueItem.nameKey) ||
						a.id.localeCompare(b.id)
				);
			return rows;
		}
	);
	db.item.findFirst.mockImplementation(
		async ({ where }: { where: ItemWhere }) =>
			items.filter((item) => matches(item, where)).map(fullRow)[0] ?? null
	);
	db.item.updateMany.mockImplementation(
		async ({ where, data }: { where: ItemWhere; data: Partial<ItemRow> }) => {
			let count = 0;
			for (const item of items)
				if (matches(item, where)) {
					Object.assign(item, data);
					count += 1;
				}
			return { count };
		}
	);
	db.item.update.mockImplementation(
		async ({ where, data }: { where: ItemWhere; data: Partial<ItemRow> }) => {
			const item = items.find((entry) => matches(entry, where));
			if (!item) throw new Error("P2025");
			Object.assign(item, data);
			return fullRow(item);
		}
	);
});
const assign = (body: object, projectId = "p1"): request.Test =>
	request(app)
		.post(`/api/v1/projects/${projectId}/assignments`)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
const assignOne = (
	itemId: string,
	body: object,
	projectId = "p1"
): request.Test =>
	request(app)
		.patch(`/api/v1/projects/${projectId}/items/${itemId}`)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
const assignmentOf = (unitId: string): string | null =>
	items.find(
		(item) => item.unitId === unitId && item.catalogueItemId === "cabinet"
	)!.subcontractorId;
/** The only fields an Assignment may write; never the Progression or its entries. */
const expectAssignmentWrite = (
	data: Record<string, unknown>,
	subcontractorId: string | null
): void => {
	expect(Object.keys(data).sort()).toEqual(["assignedAt", "subcontractorId"]);
	expect(data["subcontractorId"]).toBe(subcontractorId);
	if (subcontractorId === null) expect(data["assignedAt"]).toBeNull();
	else expect(data["assignedAt"]).toBeInstanceOf(Date);
};

it("assigns every selected unassigned Item and returns the full Project with the counts", async () => {
	seed({ u1: null, u2: null, u3: null, u4: null, u5: null });
	const response = await assign({
		catalogueItemId: "cabinet",
		subcontractorId: "acme",
	});
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ assigned: 5, skipped: 0 });
	expect(transaction).toHaveBeenCalledOnce();
	expect(db.item.updateMany).toHaveBeenCalledOnce();
	const [call] = db.item.updateMany.mock.calls[0] as [
		{ where: { id: { in: Array<string> } }; data: Record<string, unknown> },
	];
	expect(call.where.id.in.sort()).toEqual([
		"u1-cabinet",
		"u2-cabinet",
		"u3-cabinet",
		"u4-cabinet",
		"u5-cabinet",
	]);
	expectAssignmentWrite(call.data, "acme");
	for (const unitId of ["u1", "u2", "u3", "u4", "u5"])
		expect(assignmentOf(unitId)).toBe("acme");
	const project = response.body.data;
	expect(project).toMatchObject({
		id: "p1",
		itemCount: 5,
		entryCount: 10,
		progression: 40,
	});
	expect(project.blocks[0].storeys[0].units[0].items).toEqual([
		{ catalogueItemId: "cabinet", subcontractorId: "acme", entryCount: 2 },
	]);
	expect(project.blocks[0].storeys[0].units[0]).toMatchObject({
		progression: 40,
		entryCount: 2,
	});
});
it("skips Items assigned elsewhere and Items already assigned to the target", async () => {
	seed({ u1: "bolt", u2: "bolt", u3: null, u4: "acme", u5: null });
	const response = await assign({
		catalogueItemId: "cabinet",
		subcontractorId: "acme",
	});
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ assigned: 2, skipped: 3 });
	const [call] = db.item.updateMany.mock.calls[0] as [
		{ where: { id: { in: Array<string> } }; data: Record<string, unknown> },
	];
	expect(call.where.id.in.sort()).toEqual(["u3-cabinet", "u5-cabinet"]);
	expectAssignmentWrite(call.data, "acme");
	expect(assignmentOf("u1")).toBe("bolt");
	expect(assignmentOf("u2")).toBe("bolt");
	expect(assignmentOf("u4")).toBe("acme");
	expect(response.body.data.blocks[0].storeys[0].units[0].items).toEqual([
		{ catalogueItemId: "cabinet", subcontractorId: "bolt", entryCount: 2 },
	]);
});
it("reassigns Items assigned elsewhere when asked, still skipping those already the target's", async () => {
	seed({ u1: "bolt", u2: "bolt", u3: null, u4: "acme", u5: null });
	const response = await assign({
		catalogueItemId: "cabinet",
		subcontractorId: "acme",
		reassign: true,
	});
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ assigned: 4, skipped: 1 });
	const [call] = db.item.updateMany.mock.calls[0] as [
		{ where: { id: { in: Array<string> } }; data: Record<string, unknown> },
	];
	expect(call.where.id.in.sort()).toEqual([
		"u1-cabinet",
		"u2-cabinet",
		"u3-cabinet",
		"u5-cabinet",
	]);
	expectAssignmentWrite(call.data, "acme");
	for (const unitId of ["u1", "u2", "u3", "u4", "u5"])
		expect(assignmentOf(unitId)).toBe("acme");
});
it("writes nothing when every selected Item is already the target's", async () => {
	seed({ u1: "acme", u2: "acme", u3: "acme", u4: "acme", u5: "acme" });
	const response = await assign({
		catalogueItemId: "cabinet",
		subcontractorId: "acme",
		reassign: true,
	});
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ assigned: 0, skipped: 5 });
	expect(db.item.updateMany).not.toHaveBeenCalled();
});
it("unassigns every selected assigned Item with null, skipping those with no Assignment", async () => {
	seed({ u1: "bolt", u2: "acme", u3: null, u4: "acme", u5: null });
	const response = await assign({
		catalogueItemId: "cabinet",
		subcontractorId: null,
	});
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ assigned: 3, skipped: 2 });
	const [call] = db.item.updateMany.mock.calls[0] as [
		{ where: { id: { in: Array<string> } }; data: Record<string, unknown> },
	];
	expect(call.where.id.in.sort()).toEqual([
		"u1-cabinet",
		"u2-cabinet",
		"u4-cabinet",
	]);
	expectAssignmentWrite(call.data, null);
	for (const unitId of ["u1", "u2", "u3", "u4", "u5"])
		expect(assignmentOf(unitId)).toBeNull();
	expect(response.body.data).toMatchObject({ itemCount: 5, progression: 40 });
});
it("honours the Unit selection and counts only Items made from the Catalogue Item", async () => {
	seed({ u1: null, u2: "bolt", u3: null, u4: null, u5: null });
	seed({ u1: null, u4: null }, "sink");
	const response = await assign({
		catalogueItemId: "cabinet",
		subcontractorId: "acme",
		blockIds: ["b1"],
		unitTypeIds: ["t1", "t2"],
	});
	expect(response.status).toBe(200);
	expect(response.body.meta).toEqual({ assigned: 2, skipped: 1 });
	const [call] = db.item.updateMany.mock.calls[0] as [
		{ where: { id: { in: Array<string> } } },
	];
	expect(call.where.id.in.sort()).toEqual(["u1-cabinet", "u3-cabinet"]);
	expect(assignmentOf("u4")).toBeNull();
	expect(
		items.find((item) => item.id === "u1-sink")!.subcontractorId
	).toBeNull();
	// Block C holds no Units, so nothing is selected and nothing counted.
	const empty = await assign({
		catalogueItemId: "cabinet",
		subcontractorId: "acme",
		blockIds: ["b3"],
	});
	expect(empty.body.meta).toEqual({ assigned: 0, skipped: 0 });
});
it("answers 404 for an unknown Subcontractor and writes nothing", async () => {
	seed({ u1: null });
	const response = await assign({
		catalogueItemId: "cabinet",
		subcontractorId: "missing",
	});
	expect(response.status).toBe(404);
	expect(response.body.error.code).toBe("NOT_FOUND");
	expect(db.item.updateMany).not.toHaveBeenCalled();
});
it.each([
	["Block", { blockIds: ["b1", "b9"] }],
	["Storey", { storeyIds: ["s9"] }],
	["Unit Type", { unitTypeIds: ["t1", "t9"] }],
	["unknown Block", { blockIds: ["missing"] }],
])(
	"answers 404 for a %s of another Project and writes nothing",
	async (_label, selection) => {
		seed({ u1: null });
		const response = await assign({
			catalogueItemId: "cabinet",
			subcontractorId: "acme",
			...selection,
		});
		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("NOT_FOUND");
		expect(db.item.updateMany).not.toHaveBeenCalled();
	}
);
it("answers 404 for a Catalogue Item of another Project or an unknown Project", async () => {
	const body = { catalogueItemId: "other-1", subcontractorId: "acme" };
	expect((await assign(body)).status).toBe(404);
	expect(
		(await assign({ ...body, catalogueItemId: "cabinet" }, "p2")).status
	).toBe(404);
	expect(
		(await assign({ ...body, catalogueItemId: "cabinet" }, "missing")).status
	).toBe(404);
	expect(db.item.updateMany).not.toHaveBeenCalled();
});
it.each([
	{},
	{ subcontractorId: "acme" },
	{ catalogueItemId: "cabinet" },
	{ catalogueItemId: "cabinet", subcontractorId: "" },
	{ catalogueItemId: "cabinet", subcontractorId: "acme", reassign: "yes" },
	{ catalogueItemId: "cabinet", subcontractorId: "acme", blockIds: [] },
])("rejects a malformed body before any transaction: %j", async (body) => {
	const response = await assign(body);
	expect(response.status).toBe(400);
	expect(transaction).not.toHaveBeenCalled();
});
it("requires a verified Session", async () => {
	const response = await request(app)
		.post("/api/v1/projects/p1/assignments")
		.send({ catalogueItemId: "cabinet", subcontractorId: "acme" });
	expect(response.status).toBe(401);
});

it("sets, changes and clears one Item's Assignment and answers with the Unit's Items", async () => {
	seed({ u1: null });
	seed({ u1: "bolt" }, "sink", 70);
	const set = await assignOne("u1-cabinet", { subcontractorId: "acme" });
	expect(set.status).toBe(200);
	expect(db.item.update).toHaveBeenCalledOnce();
	const [setCall] = db.item.update.mock.calls[0] as [
		{ where: { id: string }; data: Record<string, unknown> },
	];
	expect(setCall.where).toEqual({ id: "u1-cabinet" });
	expectAssignmentWrite(setCall.data, "acme");
	expect(set.body.data).toEqual([
		{
			id: "u1-cabinet",
			catalogueItemId: "cabinet",
			name: "Kitchen cabinet",
			subcontractor: { id: "acme", name: "Acme Fitout" },
			assignedAt: expect.any(String),
			progression: 40,
			latestEntry: null,
		},
		{
			id: "u1-sink",
			catalogueItemId: "sink",
			name: "Sink",
			subcontractor: { id: "bolt", name: "Bolt Electrical" },
			assignedAt: "2026-09-01T00:00:00.000Z",
			progression: 70,
			latestEntry: null,
		},
	]);
	const change = await assignOne("u1-cabinet", { subcontractorId: "bolt" });
	expect(change.status).toBe(200);
	expect(change.body.data[0].subcontractor).toEqual({
		id: "bolt",
		name: "Bolt Electrical",
	});
	const clear = await assignOne("u1-cabinet", { subcontractorId: null });
	expect(clear.status).toBe(200);
	const [clearCall] = db.item.update.mock.calls[2] as [
		{ data: Record<string, unknown> },
	];
	expectAssignmentWrite(clearCall.data, null);
	expect(clear.body.data[0]).toMatchObject({
		subcontractor: null,
		assignedAt: null,
		progression: 40,
	});
	expect(db.item.updateMany).not.toHaveBeenCalled();
});
it("leaves an unchanged Assignment alone", async () => {
	seed({ u1: "acme" });
	const response = await assignOne("u1-cabinet", { subcontractorId: "acme" });
	expect(response.status).toBe(200);
	expect(db.item.update).not.toHaveBeenCalled();
	expect(response.body.data[0].assignedAt).toBe("2026-09-01T00:00:00.000Z");
});
it("answers 404 for an Item of another Project, an unknown Item or an unknown Subcontractor", async () => {
	seed({ u1: null });
	seed({ u9: null }, "other-1");
	expect(
		(await assignOne("u9-other-1", { subcontractorId: "acme" })).status
	).toBe(404);
	expect(
		(await assignOne("u1-cabinet", { subcontractorId: "acme" }, "p2")).status
	).toBe(404);
	expect((await assignOne("missing", { subcontractorId: "acme" })).status).toBe(
		404
	);
	expect(
		(await assignOne("u1-cabinet", { subcontractorId: "missing" })).status
	).toBe(404);
	expect(db.item.update).not.toHaveBeenCalled();
});
it.each([{}, { subcontractorId: "" }, { subcontractorId: 3 }])(
	"rejects a malformed single Assignment: %j",
	async (body) => {
		seed({ u1: null });
		const response = await assignOne("u1-cabinet", body);
		expect(response.status).toBe(400);
		expect(transaction).not.toHaveBeenCalled();
	}
);

it("documents the Assignment routes with their counts and the Unit's Items", async () => {
	const response = await request(app).get("/openapi.json");
	const bulk = response.body.paths["/api/v1/projects/{id}/assignments"]?.post;
	expect(bulk).toBeDefined();
	expect(bulk.security).toEqual([{ bearerAuth: [] }]);
	for (const code of [200, 400, 401, 404])
		expect(bulk.responses).toHaveProperty(String(code));
	const schema = bulk.responses["200"].content["application/json"].schema;
	expect(schema.properties.meta.properties).toHaveProperty("assigned");
	expect(schema.properties.meta.properties).toHaveProperty("skipped");
	const one = response.body.paths["/api/v1/projects/{id}/items/{itemId}"]?.patch;
	expect(one).toBeDefined();
	for (const code of [200, 400, 401, 404])
		expect(one.responses).toHaveProperty(String(code));
	expect(response.body.components.schemas.UnitItem.properties).toHaveProperty(
		"subcontractor"
	);
	const deletion = response.body.paths["/api/v1/subcontractors/{id}"]?.delete;
	expect(deletion.responses["409"].description).toContain(
		"SUBCONTRACTOR_HAS_ASSIGNMENTS"
	);
});
