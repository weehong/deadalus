import request from "supertest";
import { beforeAll, beforeEach, afterAll, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const db = {
	project: { findUnique: vi.fn() },
	block: { findFirst: vi.fn() },
	storey: { findMany: vi.fn() },
	unitType: { findFirst: vi.fn() },
	unit: {
		findMany: vi.fn(),
		findFirst: vi.fn(),
		createMany: vi.fn(),
		update: vi.fn(),
		delete: vi.fn(),
	},
};
const transaction = vi.fn(async (work) => work(db));
vi.mock("@/lib/prisma.js", () => ({
	prisma: { ...db, $transaction: transaction },
}));
let app: import("express").Application;
let token: string;
const project = {
	id: "p",
	name: "Gardens",
	code: "EG",
	blocks: [{ id: "b", name: "A", position: 0, storeys: [] }],
	unitTypes: [],
};
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	app = (await import("@/app.js")).createApp();
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
	vi.clearAllMocks();
	db.unit.createMany.mockReset();
	transaction.mockImplementation(async (work) => work(db));
	db.project.findUnique.mockResolvedValue(project);
	db.unit.findMany.mockResolvedValue([]);
	db.storey.findMany.mockResolvedValue([{ id: "s1" }, { id: "s2" }]);
	db.unitType.findFirst.mockResolvedValue({ id: "t" });
	db.block.findFirst.mockImplementation(async ({ where }) =>
		where.projectId === "p" ? { id: where.id } : null
	);
	db.unit.findFirst.mockImplementation(async ({ where }) =>
		where.storey.block.projectId === "p" ? { id: "s", storeyId: "s1" } : null
	);
});
it("creates every name in each selected Storey with independent positions", async () => {
	db.unit.findMany.mockResolvedValue([
		{ storeyId: "s1", nameKey: "old", position: 8 },
	]);
	db.unit.createMany.mockImplementation(async ({ data }) => {
		db.project.findUnique.mockResolvedValue({
			...project,
			blocks: [
				{
					id: "b",
					name: "A",
					position: 0,
					storeys: ["s1", "s2"].map((id) => ({
						id,
						name: id,
						position: 0,
						units: data
							.filter((u: { storeyId: string }) => u.storeyId === id)
							.map((u: object, i: number) => ({ ...u, id: String(i) })),
					})),
				},
			],
		});
	});
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/units")
		.set("Authorization", `Bearer ${token}`)
		.send({ storeyIds: ["s1", "s2"], names: [" B ", "A"], unitTypeId: "t" });
	expect(response.status).toBe(201);
	expect(
		response.body.data.blocks[0].storeys.map(
			(s: {
				units: Array<{ name: string; position: number; unitTypeId: string }>;
			}) => s.units.map((u) => [u.name, u.position, u.unitTypeId])
		)
	).toEqual([
		[
			["B", 9, "t"],
			["A", 10, "t"],
		],
		[
			["B", 0, "t"],
			["A", 1, "t"],
		],
	]);
});
it.each([
	[],
	Array.from({ length: 501 }, (_, i) => String(i)),
	[" "],
	["X".repeat(61)],
	["A", " a "],
])("rejects invalid names before writes", async (names) => {
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/units")
		.set("Authorization", `Bearer ${token}`)
		.send({ storeyIds: ["s1", "s2"], names });
	expect(response.status).toBe(400);
	expect(transaction).not.toHaveBeenCalled();
});
it("lists every clashing spelling and inserts nothing", async () => {
	db.unit.findMany.mockResolvedValue([
		{ nameKey: "a", position: 1, storeyId: "s1" },
		{ nameKey: "a", position: 0, storeyId: "s2" },
		{ nameKey: "b b", position: 2, storeyId: "s2" },
	]);
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/units")
		.set("Authorization", `Bearer ${token}`)
		.send({ storeyIds: ["s1", "s2"], names: ["A", "B  B", "C"] });
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "UNIT_NAME_TAKEN",
		details: { names: ["A", "B  B"] },
	});
	expect(db.unit.createMany).not.toHaveBeenCalled();
});
it("requires a Session", async () => {
	expect(
		(
			await request(app)
				.post("/api/v1/projects/p/blocks/b/units")
				.send({ storeyIds: ["s1", "s2"], names: ["A"] })
		).status
	).toBe(401);
});
it("requires a Block of this Project", async () => {
	db.block.findFirst.mockResolvedValue(null);
	expect(
		(
			await request(app)
				.post("/api/v1/projects/p/blocks/b/units")
				.set("Authorization", `Bearer ${token}`)
				.send({ storeyIds: ["s1", "s2"], names: ["A"] })
		).status
	).toBe(404);
});
it("renames in place and returns a full Project", async () => {
	const response = await request(app)
		.patch("/api/v1/projects/p/units/s")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "New" });
	expect(response.status).toBe(200);
	expect(response.body.data).toEqual(project);
});
it.each(["patch", "delete"] as const)(
	"scopes %s to the Project",
	async (method) => {
		const call = request(app);
		const response = await call[method]("/api/v1/projects/other/units/s")
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "New" });
		expect(response.status).toBe(404);
		expect(db.unit.update).not.toHaveBeenCalled();
		expect(db.unit.delete).not.toHaveBeenCalled();
	}
);
it("refuses a sibling rename clash", async () => {
	db.unit.findMany.mockResolvedValue([{ nameKey: "a" }]);
	const response = await request(app)
		.patch("/api/v1/projects/p/units/s")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "A" });
	expect(response.status).toBe(409);
});
it("deletes a scoped Unit", async () => {
	const response = await request(app)
		.delete("/api/v1/projects/p/units/s")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(204);
});
it("documents all three guarded routes", async () => {
	const response = await request(app).get("/openapi.json");
	for (const [path, method] of [
		["/api/v1/projects/{id}/blocks/{blockId}/units", "post"],
		["/api/v1/projects/{id}/units/{unitId}", "patch"],
		["/api/v1/projects/{id}/units/{unitId}", "delete"],
	])
		expect(response.body.paths[path!]?.[method!]?.security).toEqual([
			{ bearerAuth: [] },
		]);
});
it("retries a serialization conflict before returning the complete batch", async () => {
	const { Prisma } = await import("@prisma/client");
	transaction.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("retry", {
			code: "P2034",
			clientVersion: "6",
		})
	);
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/units")
		.set("Authorization", `Bearer ${token}`)
		.send({ storeyIds: ["s1", "s2"], names: ["A"] });
	expect(response.status).toBe(201);
	expect(transaction).toHaveBeenCalledTimes(2);
});
it("maps a concurrent unique violation to the winning names", async () => {
	const { Prisma } = await import("@prisma/client");
	db.unit.createMany.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("unique", {
			code: "P2002",
			clientVersion: "6",
		})
	);
	db.unit.findMany
		.mockResolvedValueOnce([])
		.mockResolvedValueOnce([{ nameKey: "a" }]);
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/units")
		.set("Authorization", `Bearer ${token}`)
		.send({ storeyIds: ["s1", "s2"], names: ["A", "B"] });
	expect(response.status).toBe(409);
	expect(response.body.error.details).toEqual({ names: ["A"] });
});
it.each([
	{ storeyIds: [], names: ["A"] },
	{ storeyIds: ["s1", "s1"], names: ["A"] },
	{ storeyIds: Array.from({ length: 201 }, (_, i) => String(i)), names: ["A"] },
	{
		storeyIds: ["s1", "s2", "s3", "s4", "s5"],
		names: Array.from({ length: 401 }, (_, i) => String(i)),
	},
])("rejects invalid Storey batches and product overflow", async (body) => {
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/units")
		.set("Authorization", `Bearer ${token}`)
		.send(body);
	expect(response.status).toBe(400);
	expect(transaction).not.toHaveBeenCalled();
});
it("rejects a Storey outside the Block before inserting any Units", async () => {
	db.storey.findMany.mockResolvedValue([{ id: "s1" }]);
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/units")
		.set("Authorization", `Bearer ${token}`)
		.send({ storeyIds: ["s1", "foreign"], names: ["A"] });
	expect(response.status).toBe(404);
	expect(db.unit.createMany).not.toHaveBeenCalled();
});
it.each(["post", "patch"] as const)(
	"rejects a foreign Unit Type on %s",
	async (method) => {
		db.unitType.findFirst.mockResolvedValue(null);
		const call = request(app);
		const response = await call[method](
			method === "post"
				? "/api/v1/projects/p/blocks/b/units"
				: "/api/v1/projects/p/units/u"
		)
			.set("Authorization", `Bearer ${token}`)
			.send({ storeyIds: ["s1", "s2"], names: ["A"], unitTypeId: "foreign" });
		expect(response.status).toBe(404);
		expect(db.unit.createMany).not.toHaveBeenCalled();
		expect(db.unit.update).not.toHaveBeenCalled();
	}
);
it.each(["patch", "delete"] as const)(
	"requires authentication for %s",
	async (method) => {
		const call = request(app);
		expect(
			(await call[method]("/api/v1/projects/p/units/u").send({ name: "A" }))
				.status
		).toBe(401);
	}
);
it.each([
	{ unitTypeId: "t" },
	{ unitTypeId: null },
	{ name: "Renamed", unitTypeId: null },
])("edits or clears a type without changing untouched fields", async (body) => {
	const current = { id: "u", name: "Original", position: 7, unitTypeId: "old" };
	db.unit.update.mockImplementation(async ({ data }) => {
		db.project.findUnique.mockResolvedValue({
			...project,
			blocks: [
				{
					id: "b",
					name: "A",
					position: 0,
					storeys: [
						{
							id: "s1",
							name: "01",
							position: 0,
							units: [{ ...current, ...data }],
						},
					],
				},
			],
		});
	});
	const response = await request(app)
		.patch("/api/v1/projects/p/units/u")
		.set("Authorization", `Bearer ${token}`)
		.send(body);
	expect(response.status).toBe(200);
	expect(response.body.data.blocks[0].storeys[0].units[0]).toMatchObject({
		...current,
		...body,
	});
});
it("rejects an empty edit", async () => {
	expect(
		(
			await request(app)
				.patch("/api/v1/projects/p/units/u")
				.set("Authorization", `Bearer ${token}`)
				.send({})
		).status
	).toBe(400);
});

it.each(["post", "patch"] as const)(
	"returns scoped404 when a type disappears during %s",
	async (method) => {
		const { Prisma } = await import("@prisma/client");
		const error = new Prisma.PrismaClientKnownRequestError("foreign key", {
			code: "P2003",
			clientVersion: "6",
		});
		db.unitType.findFirst
			.mockResolvedValueOnce({ id: "t" })
			.mockResolvedValueOnce(null);
		if (method === "post") db.unit.createMany.mockRejectedValueOnce(error);
		else db.unit.update.mockRejectedValueOnce(error);
		const call = request(app);
		const response = await call[method](
			method === "post"
				? "/api/v1/projects/p/blocks/b/units"
				: "/api/v1/projects/p/units/u"
		)
			.set("Authorization", `Bearer ${token}`)
			.send({ storeyIds: ["s1", "s2"], names: ["A"], unitTypeId: "t" });
		expect(response.status).toBe(404);
	}
);

it("rejects adding Units through another Project", async () => {
	const response = await request(app)
		.post("/api/v1/projects/other/blocks/b/units")
		.set("Authorization", `Bearer ${token}`)
		.send({ storeyIds: ["s1", "s2"], names: ["A"] });
	expect(response.status).toBe(404);
	expect(db.unit.createMany).not.toHaveBeenCalled();
});
