import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const findUnique = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: { subcontractor: { findUnique } },
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
describe("Subcontractor screen over HTTP", () => {
	it("returns a full Subcontractor with its Members in the stored order", async () => {
		findUnique.mockResolvedValue({
			id: "acme",
			name: "Acme Fitout",
			members: [
				{ id: "alex1", name: "Alex", phone: "+6591111111" },
				{ id: "alex2", name: "Alex", phone: "+6592222222" },
				{ id: "mei", name: "Mei", phone: "+6593333333" },
			],
		});
		const response = await request(app)
			.get("/api/v1/subcontractors/acme")
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				id: "acme",
				name: "Acme Fitout",
				members: [
					{ id: "alex1", name: "Alex", phone: "+6591111111" },
					{ id: "alex2", name: "Alex", phone: "+6592222222" },
					{ id: "mei", name: "Mei", phone: "+6593333333" },
				],
			},
		});
	});
});

it.each([undefined, "invalid-token"])(
	"refuses an unverified Session (%s)",
	async (bearer) => {
		const call = request(app).get("/api/v1/subcontractors/acme");
		if (bearer) call.set("Authorization", `Bearer ${bearer}`);
		const response = await call;
		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	}
);
it("returns not found for an unknown Subcontractor", async () => {
	findUnique.mockResolvedValue(null);
	const response = await request(app)
		.get("/api/v1/subcontractors/missing")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(404);
	expect(response.body.error.code).toBe("NOT_FOUND");
});
it("documents the guarded read route and its full Subcontractor response", async () => {
	const response = await request(app).get("/openapi.json");
	const operation = response.body.paths["/api/v1/subcontractors/{id}"]?.get;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	expect(operation.responses).toHaveProperty("404");
	expect(
		operation.responses[200].content["application/json"].schema.properties.data
	).toEqual({ $ref: "#/components/schemas/Subcontractor" });
});
