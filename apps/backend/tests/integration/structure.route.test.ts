import request from "supertest";
import { beforeAll, beforeEach, afterAll, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const db = {
	project: { findUnique: vi.fn() },
	block: { count: vi.fn(), createMany: vi.fn() },
	storey: { createMany: vi.fn() },
	unit: { createMany: vi.fn() },
	unitType: { findMany: vi.fn(), createMany: vi.fn() },
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
};
const body = {
	blocks: [
		{
			name: " West ",
			storeys: [
				{
					name: "01",
					units: [
						{ name: "01", unitTypeCode: "A 1" },
						{ name: "02", unitTypeCode: "a1" },
						{ name: "03", unitTypeCode: "BP2(p)" },
						{ name: "04" },
					],
				},
			],
		},
	],
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
	db.project.findUnique.mockResolvedValue(project);
	db.block.count.mockResolvedValue(0);
	db.unitType.findMany.mockResolvedValue([{ id: "existing", codeKey: "A1" }]);
});
const send = (value: object): request.Test =>
	request(app)
		.post("/api/v1/projects/p/structure")
		.set("Authorization", `Bearer ${token}`)
		.send(value);
it("requires authentication", async () => {
	expect(
		(await request(app).post("/api/v1/projects/p/structure").send(body)).status
	).toBe(401);
	expect(transaction).not.toHaveBeenCalled();
});
it("requires an existing empty Project", async () => {
	db.project.findUnique.mockResolvedValueOnce(null);
	expect((await send(body)).status).toBe(404);
	db.block.count.mockResolvedValue(3);
	const response = await send(body);
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "PROJECT_HAS_BLOCKS",
		details: { blockCount: 3 },
	});
	expect(db.block.createMany).not.toHaveBeenCalled();
});
it.each([
	{ blocks: [] },
	{
		blocks: Array.from({ length: 51 }, (_, i) => ({
			name: String(i),
			storeys: [],
		})),
	},
	{ blocks: [{ name: " ", storeys: [] }] },
	{ blocks: [{ name: "a".repeat(61), storeys: [] }] },
	...["", "x".repeat(41)].map((code) => ({
		blocks: [
			{
				name: "A",
				storeys: [{ name: "01", units: [{ name: "01", unitTypeCode: code }] }],
			},
		],
	})),
	{ blocks: [{ name: "A", storeys: [{ name: "", units: [] }] }] },
	{
		blocks: [
			{
				name: "A",
				storeys: [{ name: "01", units: [{ name: "x".repeat(61) }] }],
			},
		],
	},
	{
		blocks: [
			{
				name: "A",
				storeys: [
					{
						name: "01",
						units: Array.from({ length: 10001 }, (_, i) => ({
							name: String(i),
						})),
					},
				],
			},
		],
	},
])("rejects invalid structure before writes", async (value) => {
	expect((await send(value)).status).toBe(400);
	expect(transaction).not.toHaveBeenCalled();
});
it.each([
	{
		blocks: [
			{ name: "West", storeys: [] },
			{ name: " west ", storeys: [] },
		],
	},
	{
		blocks: [
			{
				name: "A",
				storeys: [
					{ name: "Floor 1", units: [] },
					{ name: " floor  1 ", units: [] },
				],
			},
		],
	},
	{
		blocks: [
			{
				name: "A",
				storeys: [{ name: "01", units: [{ name: "A" }, { name: " a " }] }],
			},
		],
	},
])("reports duplicate sibling names in details", async (value) => {
	const response = await send(value);
	expect(response.status).toBe(400);
	expect(JSON.stringify(response.body.error.details)).toContain(
		"Duplicate sibling names"
	);
	expect(transaction).not.toHaveBeenCalled();
});
it("creates ordered rows atomically, reuses code keys and preserves first spelling", async () => {
	const response = await send(body);
	expect(response.status).toBe(201);
	expect(response.body.data).toEqual(project);
	expect(transaction).toHaveBeenCalledWith(
		expect.any(Function),
		expect.objectContaining({ isolationLevel: "Serializable" })
	);
	expect(db.block.count).toHaveBeenCalledWith({ where: { projectId: "p" } });
	expect(db.unitType.createMany).toHaveBeenCalledWith({
		data: [
			expect.objectContaining({
				projectId: "p",
				code: "BP2(p)",
				codeKey: "BP2(P)",
				description: null,
			}),
		],
	});
	expect(db.block.createMany).toHaveBeenCalledWith({
		data: [
			expect.objectContaining({ name: "West", nameKey: "west", position: 0 }),
		],
	});
	expect(db.storey.createMany).toHaveBeenCalledWith({
		data: [expect.objectContaining({ name: "01", position: 0 })],
	});
	const units = db.unit.createMany.mock.calls[0]![0].data;
	expect(
		units.map((unit: { position: number; unitTypeId: string | null }) => [
			unit.position,
			unit.unitTypeId,
		])
	).toEqual([
		[0, "existing"],
		[1, "existing"],
		[2, expect.any(String)],
		[3, null],
	]);
});
it("rechecks emptiness after a serialization race", async () => {
	const { Prisma } = await import("@prisma/client");
	transaction.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("retry", {
			code: "P2034",
			clientVersion: "6",
		})
	);
	db.block.count.mockResolvedValue(1);
	const response = await send(body);
	expect(response.status).toBe(409);
	expect(transaction).toHaveBeenCalledTimes(2);
});
it("documents the guarded structure route", async () => {
	const response = await request(app).get("/openapi.json");
	expect(
		response.body.paths["/api/v1/projects/{id}/structure"].post.security
	).toEqual([{ bearerAuth: [] }]);
});

it("validates large authenticated JSON and refuses malformed or oversized bodies", async () => {
	const path = "/api/v1/projects/p/structure";
	expect(
		(
			await request(app)
				.post(path)
				.set("Content-Type", "application/json")
				.send("{")
		).status
	).toBe(401);
	expect(
		(
			await request(app)
				.post(path)
				.set("Authorization", `Bearer ${token}`)
				.set("Content-Type", "application/json")
				.send("{")
		).status
	).toBe(400);
	expect(
		(await send({ padding: "x".repeat(8 * 1024 * 1024), blocks: [] })).status
	).toBe(400);
	expect(transaction).not.toHaveBeenCalled();
});

it("retries a competing Unit Type insertion and reuses its winning code key", async () => {
	const { Prisma } = await import("@prisma/client");
	db.unitType.createMany.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("race", {
			code: "P2002",
			clientVersion: "6",
		})
	);
	db.unitType.findMany
		.mockResolvedValueOnce([{ id: "existing", codeKey: "A1" }])
		.mockResolvedValueOnce([
			{ id: "existing", codeKey: "A1" },
			{ id: "winner", codeKey: "BP2(P)" },
		]);
	const response = await send(body);
	expect(response.status).toBe(201);
	expect(transaction).toHaveBeenCalledTimes(2);
	expect(db.unitType.createMany).toHaveBeenCalledTimes(1);
	expect(db.unit.createMany.mock.calls[0]![0].data[2].unitTypeId).toBe(
		"winner"
	);
});
it("accepts 10,000 Units above the default JSON limit and bounds database batches", async () => {
	const response = await send({
		blocks: [
			{
				name: "Large",
				storeys: [
					{
						name: "01",
						units: Array.from({ length: 10000 }, (_, index) => ({
							name: String(index),
							unitTypeCode: "A1",
						})),
					},
				],
			},
		],
	});
	expect(response.status).toBe(201);
	expect(db.unit.createMany).toHaveBeenCalledTimes(10);
	expect(
		db.unit.createMany.mock.calls.every(([args]) => args.data.length === 1000)
	).toBe(true);
});
