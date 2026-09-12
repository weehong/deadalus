import { Prisma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

interface Record {
	id: string;
	name: string;
	nameKey: string;
	code: string;
	blocks: Array<never>;
	unitTypes: Array<never>;
}
let records: Array<Record>;
const create = vi.fn();
vi.mock("@/lib/prisma.js", () => ({ prisma: { project: { create } } }));
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
	records = [];
	create.mockImplementation(
		async ({
			data,
		}: {
			data: { name: string; nameKey: string; code: string };
		}) => {
			for (const field of ["nameKey", "code"] as const) {
				if (records.some((record) => record[field] === data[field]))
					throw new Prisma.PrismaClientKnownRequestError("Unique field", {
						code: "P2002",
						clientVersion: "test",
						meta: { target: [field] },
					});
			}
			const record = {
				id: `project-${records.length + 1}`,
				...data,
				blocks: [],
				unitTypes: [],
			};
			records.push(record);
			return {
				id: record.id,
				name: record.name,
				code: record.code,
				blocks: [],
				unitTypes: [],
			};
		}
	);
});
const validBody = { name: "Emerald Gardens", code: "EG2" };
it("creates a full Project with trimmed name and normalized code", async () => {
	const response = await request(app)
		.post("/api/v1/projects")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: " Emerald Gardens ", code: " eg2 " });
	expect(response.status).toBe(201);
	expect(response.body).toEqual({
		data: {
			id: "project-1",
			name: "Emerald Gardens",
			code: "EG2",
			blocks: [],
			unitTypes: [],
		},
	});
});
it.each([" emerald GARDENS ", "Emerald   Gardens", "Emerald\tGardens"])(
	"returns a name conflict for %s",
	async (name) => {
		await request(app)
			.post("/api/v1/projects")
			.set("Authorization", `Bearer ${token}`)
			.send(validBody);
		const response = await request(app)
			.post("/api/v1/projects")
			.set("Authorization", `Bearer ${token}`)
			.send({ name, code: "OTHER" });
		expect(response.status).toBe(409);
		expect(response.body.error.code).toBe("PROJECT_NAME_TAKEN");
	}
);
it("returns a conflict for a normalized duplicate code", async () => {
	await request(app)
		.post("/api/v1/projects")
		.set("Authorization", `Bearer ${token}`)
		.send(validBody);
	const response = await request(app)
		.post("/api/v1/projects")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "Beacon", code: " eg2 " });
	expect(response.status).toBe(409);
	expect(response.body.error.code).toBe("PROJECT_CODE_TAKEN");
});
it.each([
	[{ name: " ", code: "EG2" }, "name"],
	[{ name: "a".repeat(61), code: "EG2" }, "name"],
	[{ name: "Emerald", code: " " }, "code"],
	[{ name: "Emerald", code: "A" }, "code"],
	[{ name: "Emerald", code: "ABCDEFGHIJKLM" }, "code"],
	[{ name: "Emerald", code: "EG 2" }, "code"],
	[{ name: "Emerald", code: "EG_2" }, "code"],
	[{ name: "Emerald" }, "code"],
])("returns associated field errors for %j", async (body, field) => {
	const response = await request(app)
		.post("/api/v1/projects")
		.set("Authorization", `Bearer ${token}`)
		.send(body);
	expect(response.status).toBe(400);
	expect(response.body.error.details.fieldErrors).toHaveProperty(String(field));
});
it.each([undefined, "invalid-token"])(
	"requires a verified Session (%s)",
	async (bearer) => {
		const call = request(app).post("/api/v1/projects").send(validBody);
		if (bearer) call.set("Authorization", `Bearer ${bearer}`);
		expect((await call).status).toBe(401);
	}
);
it("does not translate unrelated unique violations", async () => {
	create.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("Other", {
			code: "P2002",
			clientVersion: "test",
			meta: { target: ["id"] },
		})
	);
	const response = await request(app)
		.post("/api/v1/projects")
		.set("Authorization", `Bearer ${token}`)
		.send(validBody);
	expect(response.status).toBe(500);
	expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
});
it("documents guarded creation with the full Project response", async () => {
	const response = await request(app).get("/openapi.json");
	const operation = response.body.paths["/api/v1/projects"]?.post;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	for (const status of [201, 400, 401, 409])
		expect(operation.responses).toHaveProperty(String(status));
	expect(
		operation.responses[201].content["application/json"].schema.properties.data
	).toEqual({ $ref: "#/components/schemas/Project" });
});
