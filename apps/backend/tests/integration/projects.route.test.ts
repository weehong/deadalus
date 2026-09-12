import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const findMany = vi.fn();
const count = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		project: { findMany, count },
		$transaction: (queries: Array<Promise<unknown>>) => Promise.all(queries),
	},
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
describe("Projects over HTTP", () => {
	it.each([undefined, "invalid-token"])(
		"refuses an unverified Session (%s)",
		async (bearer) => {
			const call = request(app).get("/api/v1/projects");
			if (bearer) call.set("Authorization", `Bearer ${bearer}`);
			const response = await call;
			expect(response.status).toBe(401);
		}
	);
	it("returns Project counts and default paging metadata", async () => {
		findMany.mockResolvedValue([
			{
				id: "eg2",
				code: "EG2",
				name: "Evergreen",
				blocks: [
					{ storeys: [{ _count: { units: 3 } }, { _count: { units: 2 } }] },
					{ storeys: [{ _count: { units: 1 } }] },
				],
			},
		]);
		count.mockResolvedValue(1);
		const response = await request(app)
			.get("/api/v1/projects")
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					id: "eg2",
					code: "EG2",
					name: "Evergreen",
					blockCount: 2,
					storeyCount: 3,
					unitCount: 6,
				},
			],
			meta: { page: 1, pageSize: 20, total: 1 },
		});
	});
	it("documents the guarded paged list", async () => {
		const response = await request(app).get("/openapi.json");
		const endpoint = response.body.paths["/api/v1/projects"]?.get;
		expect(endpoint?.security).toEqual([{ bearerAuth: [] }]);
		expect(
			endpoint?.responses[200].content["application/json"].schema.properties
		).toHaveProperty("meta");
	});
	it.each([
		"page=0",
		"page=1.5",
		"page=abc",
		"pageSize=0",
		"pageSize=1.5",
		"page=2147483647&pageSize=100",
	])("rejects invalid paging: %s", async (query) => {
		const response = await request(app)
			.get(`/api/v1/projects?${query}`)
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(400);
	});
	it("caps page size and returns the requested page ordered by name key", async () => {
		const records = Array.from({ length: 105 }, (_, index) => ({
			id: `project-${index}`,
			name: `Project ${String(index).padStart(3, "0")}`,
			nameKey: `project ${String(index).padStart(3, "0")}`,
			code: `P${index}`,
			blocks: [],
		})).reverse();
		findMany.mockImplementation(
			async ({
				skip,
				take,
				orderBy,
			}: {
				skip: number;
				take: number;
				orderBy: Array<Record<string, string>>;
			}) => {
				const sorted = [...records];
				if (orderBy.some((order) => order["nameKey"] === "asc"))
					sorted.sort((left, right) =>
						left.nameKey.localeCompare(right.nameKey)
					);
				return sorted.slice(skip, skip + take);
			}
		);
		count.mockResolvedValue(105);
		const response = await request(app)
			.get("/api/v1/projects?page=2&pageSize=500")
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.meta).toEqual({ page: 2, pageSize: 100, total: 105 });
		expect(response.body.data.map((row: { name: string }) => row.name)).toEqual(
			[
				"Project 100",
				"Project 101",
				"Project 102",
				"Project 103",
				"Project 104",
			]
		);
	});
});
