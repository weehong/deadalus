import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

const db = {
	unit: { findFirst: vi.fn() },
	item: { findMany: vi.fn() },
};
vi.mock("@/lib/prisma.js", () => ({ prisma: db }));
let app: import("express").Application;
let token: string;
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	app = (await import("@/app.js")).createApp();
});
afterAll(() => vi.unstubAllGlobals());

// Unit u1 belongs to Project p1 and holds three Items; u9 belongs to p2. The
// database answers the read's `entries` relation with the latest entry only.
const unitsOf = { p1: ["u1", "u2"], p2: ["u9"] };
const rows = [
	{
		id: "i-sink",
		unitId: "u1",
		catalogueItemId: "sink",
		subcontractorId: null,
		assignedAt: null,
		progression: 0,
		catalogueItem: { name: "Sink", nameKey: "sink" },
		subcontractor: null,
		entries: [],
	},
	{
		id: "i-cabinet",
		unitId: "u1",
		catalogueItemId: "cabinet",
		subcontractorId: "acme",
		assignedAt: new Date("2026-09-01T08:30:00Z"),
		progression: 45,
		catalogueItem: { name: "Kitchen  Cabinet", nameKey: "kitchen cabinet" },
		subcontractor: { id: "acme", name: "Acme Fitout" },
		entries: [
			{
				value: 45,
				note: "Doors hung",
				enteredByName: "administrator@example.com",
				createdAt: new Date("2026-09-10T09:15:00Z"),
			},
		],
	},
	{
		id: "i-wardrobe",
		unitId: "u1",
		catalogueItemId: "wardrobe",
		subcontractorId: "bolt",
		assignedAt: new Date("2026-09-02T00:00:00Z"),
		progression: 100,
		catalogueItem: { name: "Wardrobe", nameKey: "wardrobe" },
		subcontractor: { id: "bolt", name: "Bolt Electrical" },
		entries: [
			{
				value: 100,
				note: null,
				enteredByName: "Mei",
				createdAt: new Date("2026-09-11T02:00:00Z"),
			},
		],
	},
];
beforeEach(() => {
	vi.clearAllMocks();
	db.unit.findFirst.mockImplementation(
		async ({
			where,
		}: {
			where: { id: string; storey: { block: { projectId: string } } };
		}) => {
			const projectId = where.storey.block.projectId;
			return projectId in unitsOf &&
				unitsOf[projectId as keyof typeof unitsOf].includes(where.id)
				? { id: where.id }
				: null;
		}
	);
	// Honours the relation order the read asks for, as the database would.
	db.item.findMany.mockImplementation(
		async ({
			where,
			orderBy,
		}: {
			where: { unitId: string };
			orderBy?: Array<Record<string, unknown>>;
		}) => {
			const matching = rows.filter((row) => row.unitId === where.unitId);
			return orderBy?.some(
				(order) =>
					typeof order["catalogueItem"] === "object" &&
					order["catalogueItem"] !== null &&
					"nameKey" in order["catalogueItem"]
			)
				? [...matching].sort(
						(a, b) =>
							a.catalogueItem.nameKey.localeCompare(b.catalogueItem.nameKey) ||
							a.id.localeCompare(b.id)
					)
				: matching;
		}
	);
});
const read = (unitId: string, projectId = "p1"): request.Test =>
	request(app)
		.get(`/api/v1/projects/${projectId}/units/${unitId}/items`)
		.set("Authorization", `Bearer ${token}`);

it("lists the Unit's Items by name key with each Assignment, Progression and latest entry", async () => {
	const response = await read("u1");
	expect(response.status).toBe(200);
	expect(response.body).toEqual({
		data: [
			{
				id: "i-cabinet",
				catalogueItemId: "cabinet",
				name: "Kitchen  Cabinet",
				subcontractor: { id: "acme", name: "Acme Fitout" },
				assignedAt: "2026-09-01T08:30:00.000Z",
				progression: 45,
				latestEntry: {
					value: 45,
					note: "Doors hung",
					enteredByName: "administrator@example.com",
					createdAt: "2026-09-10T09:15:00.000Z",
				},
			},
			{
				id: "i-sink",
				catalogueItemId: "sink",
				name: "Sink",
				subcontractor: null,
				assignedAt: null,
				progression: 0,
				latestEntry: null,
			},
			{
				id: "i-wardrobe",
				catalogueItemId: "wardrobe",
				name: "Wardrobe",
				subcontractor: { id: "bolt", name: "Bolt Electrical" },
				assignedAt: "2026-09-02T00:00:00.000Z",
				progression: 100,
				latestEntry: {
					value: 100,
					note: null,
					enteredByName: "Mei",
					createdAt: "2026-09-11T02:00:00.000Z",
				},
			},
		],
	});
	// The read asks the database for the latest entry only, by createdAt then id.
	const [call] = db.item.findMany.mock.calls[0] as [
		{ select: { entries: { take: number; orderBy: unknown } } },
	];
	expect(call.select.entries.take).toBe(1);
	expect(call.select.entries.orderBy).toEqual([
		{ createdAt: "desc" },
		{ id: "desc" },
	]);
});
it("answers an empty list for a Unit holding no Items", async () => {
	const response = await read("u2");
	expect(response.status).toBe(200);
	expect(response.body).toEqual({ data: [] });
});
it("answers 404 for a Unit of another Project or an unknown Unit", async () => {
	expect((await read("u9")).status).toBe(404);
	expect((await read("u1", "p2")).status).toBe(404);
	expect((await read("missing")).status).toBe(404);
	expect((await read("u1", "missing")).status).toBe(404);
	expect(db.item.findMany).not.toHaveBeenCalled();
});
it("requires a verified Session", async () => {
	const response = await request(app).get("/api/v1/projects/p1/units/u1/items");
	expect(response.status).toBe(401);
});
it("documents the Unit's Items read", async () => {
	const response = await request(app).get("/openapi.json");
	const operation =
		response.body.paths["/api/v1/projects/{id}/units/{unitId}/items"]?.get;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	for (const code of [200, 401, 404])
		expect(operation.responses).toHaveProperty(String(code));
	const item = response.body.components.schemas.UnitItem;
	for (const property of [
		"id",
		"catalogueItemId",
		"name",
		"subcontractor",
		"assignedAt",
		"progression",
		"latestEntry",
	])
		expect(item.properties).toHaveProperty(property);
});
