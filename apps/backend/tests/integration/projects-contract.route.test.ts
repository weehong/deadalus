import request from "supertest";
import { beforeAll, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma.js", () => ({ prisma: {} }));
let app: import("express").Application;
beforeAll(async () => {
	app = (await import("@/app.js")).createApp();
});

const operations = [
	["get", "", 200],
	["post", "", 201],
	["get", "/{id}", 200],
	["patch", "/{id}", 200],
	["delete", "/{id}", 204],
	["post", "/{id}/blocks", 201],
	["patch", "/{id}/blocks/{blockId}", 200],
	["delete", "/{id}/blocks/{blockId}", 204],
	["post", "/{id}/blocks/{blockId}/storeys", 201],
	["patch", "/{id}/storeys/{storeyId}", 200],
	["delete", "/{id}/storeys/{storeyId}", 204],
	["post", "/{id}/blocks/{blockId}/units", 201],
	["patch", "/{id}/units/{unitId}", 200],
	["delete", "/{id}/units/{unitId}", 204],
	["post", "/{id}/unit-types", 201],
	["patch", "/{id}/unit-types/{unitTypeId}", 200],
	["delete", "/{id}/unit-types/{unitTypeId}", 204],
] as const;

it.each(operations)(
	"documents %s /projects%s with schemas",
	async (method, suffix, status) => {
		const response = await request(app).get("/openapi.json");
		expect(response.status).toBe(200);
		const operation =
			response.body.paths[`/api/v1/projects${suffix}`]?.[method];
		expect(operation?.security).toEqual([{ bearerAuth: [] }]);
		for (const match of suffix.matchAll(/\{([^}]+)\}/g)) {
			expect(operation.parameters).toContainEqual(
				expect.objectContaining({
					name: match[1],
					in: "path",
					required: true,
					schema: expect.objectContaining({ type: "string" }),
				})
			);
		}
		if (method === "post" || method === "patch") {
			expect(operation.requestBody.required).toBe(true);
			expect(
				operation.requestBody.content["application/json"].schema
			).toBeDefined();
		}
		expect(operation.responses[status]).toBeDefined();
		if (status !== 204)
			expect(
				operation.responses[status].content["application/json"].schema
			).toBeDefined();
		expect(operation.responses[401]).toBeDefined();
	}
);

it.each(operations)(
	"refuses missing and invalid tokens on %s /projects%s",
	async (method, suffix) => {
		const path = `/api/v1/projects${suffix.replaceAll(/\{[^}]+\}/g, "unknown")}`;
		for (const bearer of [undefined, "invalid-token"]) {
			const call = request(app)[method](path);
			if (bearer) call.set("Authorization", `Bearer ${bearer}`);
			expect((await call).status).toBe(401);
		}
	}
);
