import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const findUnique = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: { project: { findUnique } },
}));
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
				blocks,
				unitTypes: [{ id: "t", code: "AS1", description: null, unitCount: 1 }],
			},
		});
	});
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
