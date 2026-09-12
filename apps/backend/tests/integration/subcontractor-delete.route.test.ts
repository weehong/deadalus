import { Prisma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const db = {
	subcontractor: { deleteMany: vi.fn() },
	item: { count: vi.fn() },
};
const transaction = vi.fn(async (work) => work(db));
vi.mock("@/lib/prisma.js", () => ({
	prisma: { ...db, $transaction: transaction },
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
beforeEach(() => {
	vi.clearAllMocks();
	db.item.count.mockResolvedValue(0);
});
const remove = (id = "acme"): request.Test =>
	request(app)
		.delete(`/api/v1/subcontractors/${id}`)
		.set("Authorization", `Bearer ${token}`);
it("deletes a Subcontractor with an empty 204 response", async () => {
	db.subcontractor.deleteMany.mockResolvedValue({ count: 1 });
	const response = await remove();
	expect(response.status).toBe(204);
	expect(response.text).toBe("");
	expect(db.item.count).toHaveBeenCalledWith({
		where: { subcontractorId: "acme" },
	});
	expect(db.subcontractor.deleteMany).toHaveBeenCalledWith({
		where: { id: "acme" },
	});
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
	db.subcontractor.deleteMany.mockResolvedValue({ count: 0 });
	const response = await remove("missing");
	expect(response.status).toBe(404);
	expect(response.body.error.code).toBe("NOT_FOUND");
});
it("refuses with the Item count while any Item is assigned to the Subcontractor", async () => {
	db.item.count.mockResolvedValue(12);
	const response = await remove();
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "SUBCONTRACTOR_HAS_ASSIGNMENTS",
		details: { itemCount: 12 },
	});
	expect(db.subcontractor.deleteMany).not.toHaveBeenCalled();
});
it("refuses with the current count when a concurrent Assignment wins after the check", async () => {
	db.item.count.mockResolvedValueOnce(0).mockResolvedValueOnce(3);
	db.subcontractor.deleteMany.mockRejectedValue(
		new Prisma.PrismaClientKnownRequestError("restricted", {
			code: "P2003",
			clientVersion: "test",
		})
	);
	const response = await remove();
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "SUBCONTRACTOR_HAS_ASSIGNMENTS",
		details: { itemCount: 3 },
	});
});
it("documents the guarded delete route, the empty response and the refusal", async () => {
	const response = await request(app).get("/openapi.json");
	const operation = response.body.paths["/api/v1/subcontractors/{id}"]?.delete;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	expect(operation.responses).toHaveProperty("401");
	expect(operation.responses).toHaveProperty("404");
	expect(operation.responses[204]).not.toHaveProperty("content");
	expect(operation.responses["409"].description).toContain(
		"SUBCONTRACTOR_HAS_ASSIGNMENTS"
	);
});
