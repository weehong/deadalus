import request from "supertest";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const deleteMany = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: { subcontractor: { deleteMany } },
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
it("deletes a Subcontractor with an empty 204 response", async () => {
	deleteMany.mockResolvedValue({ count: 1 });
	const response = await request(app)
		.delete("/api/v1/subcontractors/acme")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(204);
	expect(response.text).toBe("");
});
it.each([undefined, "invalid-token"])(
	"refuses an unverified Session (%s)",
	async (bearer) => {
		const call = request(app).delete("/api/v1/subcontractors/acme");
		if (bearer) call.set("Authorization", `Bearer ${bearer}`);
		const response = await call;
		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	}
);
it("returns not found for an unknown Subcontractor", async () => {
	deleteMany.mockResolvedValue({ count: 0 });
	const response = await request(app)
		.delete("/api/v1/subcontractors/missing")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(404);
	expect(response.body.error.code).toBe("NOT_FOUND");
});
it("documents the guarded delete route and empty response", async () => {
	const response = await request(app).get("/openapi.json");
	const operation = response.body.paths["/api/v1/subcontractors/{id}"]?.delete;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	expect(operation.responses).toHaveProperty("401");
	expect(operation.responses).toHaveProperty("404");
	expect(operation.responses[204]).not.toHaveProperty("content");
});
