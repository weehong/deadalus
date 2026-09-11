import { Prisma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
interface Record {
	id: string;
	name: string;
	nameKey: string;
	members: Array<{ id: string; name: string; phone: string }>;
}
let records: Array<Record>;
const update = vi.fn();
const findUnique = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: { subcontractor: { update, findUnique } },
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
	records = [
		{
			id: "acme",
			name: "Acme Fitout",
			nameKey: "acme fitout",
			members: [{ id: "alex", name: "Alex", phone: "+6591234567" }],
		},
		{
			id: "beacon",
			name: "Beacon Joinery",
			nameKey: "beacon joinery",
			members: [{ id: "mei", name: "Mei", phone: "+6592345678" }],
		},
	];
	findUnique.mockImplementation(
		async ({ where }: { where: { id: string } }) => {
			const record = records.find((entry) => entry.id === where.id);
			return record
				? { id: record.id, name: record.name, members: record.members }
				: null;
		}
	);
	update.mockImplementation(
		async ({
			where,
			data,
		}: {
			where: { id: string };
			data: { name: string; nameKey: string };
		}) => {
			const record = records.find((entry) => entry.id === where.id);
			if (!record)
				throw new Prisma.PrismaClientKnownRequestError("Missing", {
					code: "P2025",
					clientVersion: "test",
				});
			if (
				records.some(
					(entry) => entry.id !== where.id && entry.nameKey === data.nameKey
				)
			)
				throw new Prisma.PrismaClientKnownRequestError("Taken", {
					code: "P2002",
					clientVersion: "test",
					meta: { target: ["nameKey"] },
				});
			Object.assign(record, data);
			return { id: record.id, name: record.name, members: record.members };
		}
	);
});
it("renames a Subcontractor and reads back the full trimmed response", async () => {
	const response = await request(app)
		.patch("/api/v1/subcontractors/acme")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: " Zenith Fitout " });
	expect(response.status).toBe(200);
	expect(response.body).toEqual({
		data: {
			id: "acme",
			name: "Zenith Fitout",
			members: [{ id: "alex", name: "Alex", phone: "+6591234567" }],
		},
	});
	const detail = await request(app)
		.get("/api/v1/subcontractors/acme")
		.set("Authorization", `Bearer ${token}`);
	expect(detail.body).toEqual(response.body);
});
it.each([" BEACON JOINERY ", "Beacon  Joinery", "Beacon\tJoinery"])(
	"refuses another Subcontractor's normalized name: %s",
	async (name) => {
		const response = await request(app)
			.patch("/api/v1/subcontractors/acme")
			.set("Authorization", `Bearer ${token}`)
			.send({ name });
		expect(response.status).toBe(409);
		expect(response.body.error.code).toBe("SUBCONTRACTOR_NAME_TAKEN");
		const detail = await request(app)
			.get("/api/v1/subcontractors/acme")
			.set("Authorization", `Bearer ${token}`);
		expect(detail.body.data.name).toBe("Acme Fitout");
	}
);
it("returns 404 for an unknown Subcontractor", async () => {
	const response = await request(app)
		.patch("/api/v1/subcontractors/missing")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "New Name" });
	expect(response.status).toBe(404);
});
it.each([{}, { name: " \t " }])(
	"returns 400 for a missing or blank name %j",
	async (body) => {
		const response = await request(app)
			.patch("/api/v1/subcontractors/acme")
			.set("Authorization", `Bearer ${token}`)
			.send(body);
		expect(response.status).toBe(400);
		expect(response.body.error.details.fieldErrors).toHaveProperty("name");
	}
);
it.each([undefined, "invalid-token"])(
	"requires a verified Session (%s)",
	async (bearer) => {
		const call = request(app)
			.patch("/api/v1/subcontractors/acme")
			.send({ name: "New Name" });
		if (bearer) call.set("Authorization", `Bearer ${bearer}`);
		expect((await call).status).toBe(401);
	}
);
it("allows its own normalized name", async () => {
	const response = await request(app)
		.patch("/api/v1/subcontractors/acme")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: " ACME FITOUT " });
	expect(response.status).toBe(200);
	expect(response.body.data.name).toBe("ACME FITOUT");
});
it("documents the guarded rename route and full response", async () => {
	const response = await request(app).get("/openapi.json");
	const operation = response.body.paths["/api/v1/subcontractors/{id}"]?.patch;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	for (const status of ["400", "401", "404", "409"])
		expect(operation.responses).toHaveProperty(status);
	expect(
		operation.responses[200].content["application/json"].schema.properties.data
	).toEqual({ $ref: "#/components/schemas/Subcontractor" });
});
