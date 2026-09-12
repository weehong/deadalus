import request from "supertest";
import { beforeAll, beforeEach, afterAll, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const db = {
	project: { findUnique: vi.fn() },
	item: { findMany: vi.fn() },
	block: {
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
	blocks: [],
	unitTypes: [],
	catalogueItems: [],
};
const noItems = { itemCount: 0, entryCount: 0, progression: null };
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	app = (await import("@/app.js")).createApp();
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
	vi.clearAllMocks();
	db.project.findUnique.mockResolvedValue(project);
	db.item.findMany.mockResolvedValue([]);
	db.block.findMany.mockResolvedValue([]);
	db.block.findFirst.mockResolvedValue({ id: "b", projectId: "p" });
});
it("creates ordered Blocks atomically and returns the full Project", async () => {
	db.block.findMany.mockResolvedValue([{ nameKey: "old", position: 8 }]);
	db.block.createMany.mockImplementation(async ({ data }) => {
		db.project.findUnique.mockResolvedValue({
			...project,
			blocks: data.map((entry: object, i: number) => ({
				...entry,
				id: `b${i}`,
				storeys: [],
			})),
		});
	});
	const response = await request(app)
		.post("/api/v1/projects/p/blocks")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: [" B ", "A"] });
	expect(response.status).toBe(201);
	expect(
		response.body.data.blocks.map((b: { name: string; position: number }) => [
			b.name,
			b.position,
		])
	).toEqual([
		["B", 9],
		["A", 10],
	]);
});
it.each([
	[],
	Array.from({ length: 501 }, (_, i) => String(i)),
	[" "],
	["A", " a "],
])("rejects invalid names before writes", async (names) => {
	const response = await request(app)
		.post("/api/v1/projects/p/blocks")
		.set("Authorization", `Bearer ${token}`)
		.send({ names });
	expect(response.status).toBe(400);
	expect(transaction).not.toHaveBeenCalled();
});
it("lists every clashing spelling and inserts nothing", async () => {
	db.block.findMany.mockResolvedValue([
		{ nameKey: "a", position: 1 },
		{ nameKey: "b b", position: 2 },
	]);
	const response = await request(app)
		.post("/api/v1/projects/p/blocks")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: ["A", "B  B", "C"] });
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "BLOCK_NAME_TAKEN",
		details: { names: ["A", "B  B"] },
	});
	expect(db.block.createMany).not.toHaveBeenCalled();
});
it("requires a Session", async () => {
	expect(
		(
			await request(app)
				.post("/api/v1/projects/p/blocks")
				.send({ names: ["A"] })
		).status
	).toBe(401);
});
it("requires a Project", async () => {
	db.project.findUnique.mockResolvedValue(null);
	expect(
		(
			await request(app)
				.post("/api/v1/projects/p/blocks")
				.set("Authorization", `Bearer ${token}`)
				.send({ names: ["A"] })
		).status
	).toBe(404);
});
it("renames in place and returns a full Project", async () => {
	const response = await request(app)
		.patch("/api/v1/projects/p/blocks/b")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "New" });
	expect(response.status).toBe(200);
	expect(response.body.data).toEqual({ ...project, ...noItems });
});
it.each(["patch", "delete"] as const)(
	"scopes %s to the Project",
	async (method) => {
		db.block.findFirst.mockResolvedValue(null);
		const call = request(app);
		const response = await call[method]("/api/v1/projects/other/blocks/b")
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "New" });
		expect(response.status).toBe(404);
		expect(db.block.update).not.toHaveBeenCalled();
		expect(db.block.delete).not.toHaveBeenCalled();
	}
);
it("refuses a sibling rename clash", async () => {
	db.block.findMany.mockResolvedValue([{ nameKey: "a" }]);
	const response = await request(app)
		.patch("/api/v1/projects/p/blocks/b")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "A" });
	expect(response.status).toBe(409);
});
it("deletes a scoped Block", async () => {
	const response = await request(app)
		.delete("/api/v1/projects/p/blocks/b")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(204);
});
it("documents all three guarded routes", async () => {
	const response = await request(app).get("/openapi.json");
	for (const [path, method] of [
		["/api/v1/projects/{id}/blocks", "post"],
		["/api/v1/projects/{id}/blocks/{blockId}", "patch"],
		["/api/v1/projects/{id}/blocks/{blockId}", "delete"],
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
		.post("/api/v1/projects/p/blocks")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: ["A"] });
	expect(response.status).toBe(201);
	expect(transaction).toHaveBeenCalledTimes(2);
});
it("maps a concurrent unique violation to the winning names", async () => {
	const { Prisma } = await import("@prisma/client");
	db.block.createMany.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("unique", {
			code: "P2002",
			clientVersion: "6",
		})
	);
	db.block.findMany
		.mockResolvedValueOnce([])
		.mockResolvedValueOnce([{ nameKey: "a" }]);
	const response = await request(app)
		.post("/api/v1/projects/p/blocks")
		.set("Authorization", `Bearer ${token}`)
		.send({ names: ["A", "B"] });
	expect(response.status).toBe(409);
	expect(response.body.error.details).toEqual({ names: ["A"] });
});
