import request from "supertest";
import { beforeAll, beforeEach, afterAll, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const db = {
	project: { findUnique: vi.fn() },
	block: { findFirst: vi.fn() },
	storey: {
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
	db.storey.createMany.mockReset();
	transaction.mockImplementation(async (work) => work(db));
	db.project.findUnique.mockResolvedValue(project);
	db.storey.findMany.mockResolvedValue([]);
	db.block.findFirst.mockImplementation(async ({ where }) =>
		where.projectId === "p" ? { id: where.id } : null
	);
	db.storey.findFirst.mockImplementation(async ({ where }) =>
		where.block.projectId === "p" ? { id: "s", blockId: "b" } : null
	);
});
it("creates ordered Storeys atomically and returns the full Project", async () => {
	db.storey.findMany.mockResolvedValue([{ nameKey: "old", position: 8 }]);
	db.storey.createMany.mockImplementation(async ({ data }) => {
		db.project.findUnique.mockResolvedValue({
			...project,
			blocks: [
				{
					id: "b",
					name: "A",
					position: 0,
					storeys: data.map((entry: object, i: number) => ({
						...entry,
						id: `b${i}`,
						units: [],
					})),
				},
			],
		});
	});
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/storeys")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: [" B ", "A"] });
	expect(response.status).toBe(201);
	expect(
		response.body.data.blocks[0].storeys.map(
			(b: { name: string; position: number }) => [b.name, b.position]
		)
	).toEqual([
		["B", 9],
		["A", 10],
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
		.post("/api/v1/projects/p/blocks/b/storeys")
		.set("Authorization", `Bearer ${token}`)
		.send({ names });
	expect(response.status).toBe(400);
	expect(transaction).not.toHaveBeenCalled();
});
it("lists every clashing spelling and inserts nothing", async () => {
	db.storey.findMany.mockResolvedValue([
		{ nameKey: "a", position: 1 },
		{ nameKey: "b b", position: 2 },
	]);
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/storeys")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: ["A", "B  B", "C"] });
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "STOREY_NAME_TAKEN",
		details: { names: ["A", "B  B"] },
	});
	expect(db.storey.createMany).not.toHaveBeenCalled();
});
it("requires a Session", async () => {
	expect(
		(
			await request(app)
				.post("/api/v1/projects/p/blocks/b/storeys")
				.send({ names: ["A"] })
		).status
	).toBe(401);
});
it("requires a Block of this Project", async () => {
	db.block.findFirst.mockResolvedValue(null);
	expect(
		(
			await request(app)
				.post("/api/v1/projects/p/blocks/b/storeys")
				.set("Authorization", `Bearer ${token}`)
				.send({ names: ["A"] })
		).status
	).toBe(404);
});
it("renames in place and returns a full Project", async () => {
	const response = await request(app)
		.patch("/api/v1/projects/p/storeys/s")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "New" });
	expect(response.status).toBe(200);
	expect(response.body.data).toEqual(project);
});
it.each(["patch", "delete"] as const)(
	"scopes %s to the Project",
	async (method) => {
		const call = request(app);
		const response = await call[method]("/api/v1/projects/other/storeys/s")
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "New" });
		expect(response.status).toBe(404);
		expect(db.storey.update).not.toHaveBeenCalled();
		expect(db.storey.delete).not.toHaveBeenCalled();
	}
);
it("refuses a sibling rename clash", async () => {
	db.storey.findMany.mockResolvedValue([{ nameKey: "a" }]);
	const response = await request(app)
		.patch("/api/v1/projects/p/storeys/s")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "A" });
	expect(response.status).toBe(409);
});
it("deletes a scoped Storey", async () => {
	const response = await request(app)
		.delete("/api/v1/projects/p/storeys/s")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(204);
});
it("documents all three guarded routes", async () => {
	const response = await request(app).get("/openapi.json");
	for (const [path, method] of [
		["/api/v1/projects/{id}/blocks/{blockId}/storeys", "post"],
		["/api/v1/projects/{id}/storeys/{storeyId}", "patch"],
		["/api/v1/projects/{id}/storeys/{storeyId}", "delete"],
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
		.post("/api/v1/projects/p/blocks/b/storeys")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: ["A"] });
	expect(response.status).toBe(201);
	expect(transaction).toHaveBeenCalledTimes(2);
});
it("maps a concurrent unique violation to the winning names", async () => {
	const { Prisma } = await import("@prisma/client");
	db.storey.createMany.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("unique", {
			code: "P2002",
			clientVersion: "6",
		})
	);
	db.storey.findMany
		.mockResolvedValueOnce([])
		.mockResolvedValueOnce([{ nameKey: "a" }]);
	const response = await request(app)
		.post("/api/v1/projects/p/blocks/b/storeys")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: ["A", "B"] });
	expect(response.status).toBe(409);
	expect(response.body.error.details).toEqual({ names: ["A"] });
});
it("accepts the same Storey name in different Blocks of a Project", async () => {
	const namesByBlock = new Map<
		string,
		Array<{ nameKey: string; position: number }>
	>();
	db.storey.findMany.mockImplementation(
		async ({ where }) => namesByBlock.get(where.blockId) ?? []
	);
	db.storey.createMany.mockImplementation(async ({ data }) => {
		namesByBlock.set(data[0].blockId, data);
	});
	for (const blockId of ["b", "other-block"]) {
		// Sequential requests prove the first Block's names do not clash in the second.

		const response = await request(app)
			.post(`/api/v1/projects/p/blocks/${blockId}/storeys`)
			.set("Authorization", `Bearer ${token}`)
			.send({ names: ["01", "02"] });
		expect(response.status).toBe(201);
	}
});
it("returns 404 for a Block of another Project", async () => {
	const response = await request(app)
		.post("/api/v1/projects/other/blocks/b/storeys")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: ["01"] });
	expect(response.status).toBe(404);
	expect(db.storey.createMany).not.toHaveBeenCalled();
});
