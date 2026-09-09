import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
	createSigningKey,
	sign,
	stubJwks,
	type SigningKey,
} from "../helpers/supabase-jwt.js";

let key: SigningKey;
let app: import("express").Application;

beforeAll(async () => {
	key = await createSigningKey();
	stubJwks(key);
	// Import the app after the JWKS stub is in place so the service's remote
	// key set only ever sees the stubbed fetch.
	const { createApp } = await import("@/app.js");
	app = createApp();
});

afterAll(() => {
	vi.unstubAllGlobals();
});

describe("GET /api/v1/me", () => {
	it("returns 401 without a bearer token", async () => {
		const response = await request(app).get("/api/v1/me");

		expect(response.status).toBe(401);
		expect(response.body).toMatchObject({
			error: { code: "UNAUTHORIZED", message: "Missing bearer token" },
		});
	});

	it("returns 401 for a token that does not verify", async () => {
		const response = await request(app)
			.get("/api/v1/me")
			.set("Authorization", "Bearer not-a-real-token");

		expect(response.status).toBe(401);
		expect(response.body).toMatchObject({
			error: { code: "UNAUTHORIZED" },
		});
	});

	it("returns the identity for a properly signed token", async () => {
		const token = await sign(key, {
			subject: "00000000-0000-4000-8000-000000000001",
			email: "administrator@example.com",
		});

		const response = await request(app)
			.get("/api/v1/me")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				id: "00000000-0000-4000-8000-000000000001",
				email: "administrator@example.com",
			},
		});
	});

	it("documents the endpoint as bearer-protected", async () => {
		const response = await request(app).get("/openapi.json");

		expect(response.body.paths["/api/v1/me"].get.security).toEqual([
			{ bearerAuth: [] },
		]);
		expect(response.body.components.securitySchemes.bearerAuth).toMatchObject({
			type: "http",
			scheme: "bearer",
		});
	});
});
