import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

const findMany = vi.fn();
const count = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		subcontractor: { findMany, count },
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

describe("Directory over HTTP", () => {
	it("rejects a page whose computed offset exceeds the database range", async () => {
		findMany.mockResolvedValue([]);
		count.mockResolvedValue(0);
		const response = await request(app)
			.get("/api/v1/subcontractors?page=2147483647&pageSize=100")
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(400);
		expect(response.body.error.details.fieldErrors).toHaveProperty("page");
	});
	it.each(["page=0", "page=1.5", "page=abc", "pageSize=0", "pageSize=1.5"])(
		"rejects invalid pagination: %s",
		async (query) => {
			const response = await request(app)
				.get(`/api/v1/subcontractors?${query}`)
				.set("Authorization", `Bearer ${token}`);
			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe("BAD_REQUEST");
		}
	);
	it("documents the guarded list and its pagination envelope", async () => {
		const response = await request(app).get("/openapi.json");
		expect(response.body.paths["/api/v1/subcontractors"].get.security).toEqual([
			{ bearerAuth: [] },
		]);
		expect(
			response.body.paths["/api/v1/subcontractors"].get.responses[200].content[
				"application/json"
			].schema.properties
		).toHaveProperty("meta");
	});
	it("caps page size and returns the requested page in alphabetical order", async () => {
		const records = Array.from({ length: 105 }, (_, index) => ({
			id: `sc-${index}`,
			name: `Subcontractor ${String(index).padStart(3, "0")}`,
			members: [{ phone: `+659123${String(index).padStart(4, "0")}` }],
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
					sorted.sort((left, right) => left.name.localeCompare(right.name));
				return sorted.slice(skip, skip + take);
			}
		);
		count.mockResolvedValue(105);
		const response = await request(app)
			.get("/api/v1/subcontractors?page=2&pageSize=500")
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.meta).toEqual({ page: 2, pageSize: 100, total: 105 });
		expect(response.body.data.map((row: { name: string }) => row.name)).toEqual(
			[
				"Subcontractor 100",
				"Subcontractor 101",
				"Subcontractor 102",
				"Subcontractor 103",
				"Subcontractor 104",
			]
		);
	});
	it("lists the Directory with default page metadata and all Member phones", async () => {
		findMany.mockResolvedValue([
			{
				id: "acme",
				name: "Acme",
				members: [{ phone: "+6591234567" }, { phone: "+6592345678" }],
			},
		]);
		count.mockResolvedValue(1);
		const response = await request(app)
			.get("/api/v1/subcontractors")
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					id: "acme",
					name: "Acme",
					memberCount: 2,
					phones: ["+6591234567", "+6592345678"],
				},
			],
			meta: { page: 1, pageSize: 20, total: 1 },
		});
	});
	it.each([undefined, "invalid-token"])(
		"refuses an unverified Session (%s)",
		async (bearer) => {
			const call = request(app).get("/api/v1/subcontractors");
			if (bearer) call.set("Authorization", `Bearer ${bearer}`);
			const response = await call;
			expect(response.status).toBe(401);
			expect(response.body.error.code).toBe("UNAUTHORIZED");
		}
	);
});
