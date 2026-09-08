import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "@/app.js";

const app = createApp();

describe("GET /health", () => {
	it("returns 200 with the health envelope", async () => {
		const response = await request(app).get("/health");

		expect(response.status).toBe(200);
		expect(response.body).toMatchObject({
			data: { status: "ok" },
		});
		expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
	});
});

describe("unknown routes", () => {
	it("returns a 404 JSON error envelope", async () => {
		const response = await request(app).get("/does-not-exist");

		expect(response.status).toBe(404);
		expect(response.body).toMatchObject({
			error: { code: "NOT_FOUND" },
		});
	});
});

describe("GET /openapi.json", () => {
	it("serves the generated OpenAPI document", async () => {
		const response = await request(app).get("/openapi.json");

		expect(response.status).toBe(200);
		expect(response.body.openapi).toBe("3.0.0");
		expect(response.body.paths).toHaveProperty("/health");
	});
});
