import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const findUnique = vi.fn();
const findMany = vi.fn(async (): Promise<Array<unknown>> => []);
vi.mock("@/lib/prisma.js", () => ({
	prisma: { project: { findUnique }, item: { findMany } },
}));
const noItems = { itemCount: 0, entryCount: 0, progression: null };
let app: import("express").Application;
let token: string;
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	const { createApp } = await import("@/app.js");
	app = createApp();
});
afterAll(() => vi.unstubAllGlobals());
describe("Project screen over HTTP", () => {
	it("returns a full Project with its Structure in position order", async () => {
		const blocks = [
			{
				id: "b",
				name: "G",
				position: 0,
				storeys: [
					{
						id: "s",
						name: "02",
						position: 0,
						units: [{ id: "u", name: "01", position: 0, unitTypeId: "t" }],
					},
				],
			},
		];
		findUnique.mockResolvedValue({
			id: "acme",
			name: "Gardens",
			code: "EG2",
			blocks,
			unitTypes: [
				{ id: "t", code: "AS1", description: null, _count: { units: 1 } },
			],
			catalogueItems: [{ id: "c", name: "Sink", _count: { items: 0 } }],
		});
		const response = await request(app)
			.get("/api/v1/projects/acme")
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				id: "acme",
				name: "Gardens",
				code: "EG2",
				...noItems,
				blocks: blocks.map((block) => ({
					...block,
					...noItems,
					storeys: block.storeys.map((storey) => ({
						...storey,
						...noItems,
						units: storey.units.map((unit) => ({
							...unit,
							...noItems,
							items: [],
						})),
					})),
				})),
				unitTypes: [{ id: "t", code: "AS1", description: null, unitCount: 1 }],
				catalogueItems: [{ id: "c", name: "Sink", itemCount: 0 }],
			},
		});
	});
});

it("rolls the stored Item Progression and entry counts up every level, null where a node holds no Items", async () => {
	const unit = (id: string): Record<string, unknown> => ({
		id,
		name: id,
		position: 0,
		unitTypeId: null,
	});
	findUnique.mockResolvedValue({
		id: "acme",
		name: "Gardens",
		code: "EG2",
		blocks: [
			{
				id: "a",
				name: "A",
				position: 0,
				storeys: [
					{
						id: "a1",
						name: "01",
						position: 0,
						units: [unit("u1"), unit("u2")],
					},
					{ id: "a2", name: "02", position: 1, units: [unit("u3")] },
				],
			},
			{
				id: "b",
				name: "B",
				position: 1,
				storeys: [{ id: "b1", name: "01", position: 0, units: [unit("u4")] }],
			},
		],
		unitTypes: [],
		catalogueItems: [],
	});
	// u1 holds a Sink at 80 (two entries) and an unassigned Wardrobe at 0;
	// u3 holds a Sink at 40 (one entry); u2, u4 and every node of Block B hold nothing.
	const row = (
		unitId: string,
		catalogueItemId: string,
		progression: number,
		entries: number
	): Record<string, unknown> => ({
		unitId,
		catalogueItemId,
		subcontractorId: null,
		progression,
		_count: { entries },
	});
	findMany.mockResolvedValueOnce([
		row("u1", "sink", 80, 2),
		row("u1", "wardrobe", 0, 0),
		row("u3", "sink", 40, 1),
	]);
	const response = await request(app)
		.get("/api/v1/projects/acme")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(200);
	expect(response.body.data).toMatchObject({
		itemCount: 3,
		entryCount: 3,
		progression: 40,
	});
	const [a, b] = response.body.data.blocks;
	expect(a).toMatchObject({ itemCount: 3, entryCount: 3, progression: 40 });
	expect(a.storeys[0]).toMatchObject({
		itemCount: 2,
		entryCount: 2,
		progression: 40,
	});
	expect(a.storeys[0].units[0]).toMatchObject({
		itemCount: 2,
		entryCount: 2,
		progression: 40,
	});
	expect(a.storeys[0].units[1]).toMatchObject(noItems);
	expect(a.storeys[1]).toMatchObject({
		itemCount: 1,
		entryCount: 1,
		progression: 40,
	});
	expect(a.storeys[1].units[0]).toMatchObject({
		itemCount: 1,
		entryCount: 1,
		progression: 40,
	});
	expect(b).toMatchObject(noItems);
	expect(b.storeys[0]).toMatchObject(noItems);
	expect(b.storeys[0].units[0]).toMatchObject(noItems);
});

it.each([undefined, "invalid-token"])(
	"refuses an unverified Session (%s)",
	async (bearer) => {
		const call = request(app).get("/api/v1/projects/acme");
		if (bearer) call.set("Authorization", `Bearer ${bearer}`);
		const response = await call;
		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	}
);
it("returns not found for an unknown Project", async () => {
	findUnique.mockResolvedValue(null);
	const response = await request(app)
		.get("/api/v1/projects/missing")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(404);
	expect(response.body.error.code).toBe("NOT_FOUND");
});
it("documents the guarded read route and its full Project response", async () => {
	const response = await request(app).get("/openapi.json");
	const operation = response.body.paths["/api/v1/projects/{id}"]?.get;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	expect(operation.responses).toHaveProperty("404");
	expect(
		operation.responses[200].content["application/json"].schema.properties.data
	).toEqual({ $ref: "#/components/schemas/Project" });
});

// A database-boundary fake interprets requested selection and ordering. The
// observable assertions below concern the HTTP response, not query structure.
interface Selection {
	select?: Record<string, boolean | Selection>;
	orderBy?: Array<Record<string, "asc" | "desc">>;
}
function selected(
	record: Record<string, unknown>,
	selection: Selection
): Record<string, unknown> {
	const result: Record<string, unknown> = {};
	for (const [key, field] of Object.entries(selection.select ?? {})) {
		const value = record[key];
		if (field === true) result[key] = value;
		else if (field && Array.isArray(value)) {
			const rows = [...value] as Array<Record<string, unknown>>;
			rows.sort((left, right) => {
				for (const ordering of field.orderBy ?? [])
					for (const [column, direction] of Object.entries(ordering)) {
						const a = left[column];
						const b = right[column];
						const comparison =
							typeof a === "number" && typeof b === "number"
								? a - b
								: String(a).localeCompare(String(b));
						if (comparison)
							return direction === "asc" ? comparison : -comparison;
					}
				return 0;
			});
			result[key] = rows.map((row) => selected(row, field));
		} else if (field && value && typeof value === "object")
			result[key] = selected(value as Record<string, unknown>, field);
	}
	return result;
}
it("orders every Structure list by position then id and the catalogue by code key", async () => {
	const unit = (id: string, position: number): Record<string, unknown> => ({
		id,
		name: id,
		position,
		unitTypeId: null,
	});
	const storey = (id: string, position: number): Record<string, unknown> => ({
		id,
		name: id,
		position,
		units: [unit("u3", 2), unit("u2", 1), unit("u1", 1)],
	});
	const block = (id: string, position: number): Record<string, unknown> => ({
		id,
		name: id,
		position,
		storeys: [storey("s3", 2), storey("s2", 1), storey("s1", 1)],
	});
	const source = {
		id: "ordered",
		code: "OR",
		name: "Ordered",
		blocks: [block("b3", 2), block("b2", 1), block("b1", 1)],
		catalogueItems: [],
		unitTypes: [
			{
				id: "t2",
				code: "b",
				codeKey: "B",
				description: null,
				_count: { units: 0 },
			},
			{
				id: "t1",
				code: " a ",
				codeKey: "A",
				description: null,
				_count: { units: 0 },
			},
		],
	};
	findUnique.mockImplementationOnce((selection: Selection) =>
		selected(source, selection)
	);
	const response = await request(app)
		.get("/api/v1/projects/ordered")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(200);
	expect(
		response.body.data.blocks.map((item: { id: string }) => item.id)
	).toEqual(["b1", "b2", "b3"]);
	expect(
		response.body.data.blocks[0].storeys.map((item: { id: string }) => item.id)
	).toEqual(["s1", "s2", "s3"]);
	expect(
		response.body.data.blocks[0].storeys[0].units.map(
			(item: { id: string }) => item.id
		)
	).toEqual(["u1", "u2", "u3"]);
	expect(
		response.body.data.unitTypes.map((item: { code: string }) => item.code)
	).toEqual([" a ", "b"]);
});
