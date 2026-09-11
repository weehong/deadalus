import { Prisma } from "@prisma/client";
import request from "supertest";
import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

interface Record {
	id: string;
	name: string;
	nameKey: string;
	members: Array<{ id: string; name: string; phone: string }>;
}
let records: Array<Record>;
const create = vi.fn();
const findUnique = vi.fn();
const findMember = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		subcontractor: { create, findUnique },
		member: { findUnique: findMember },
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
beforeEach(() => {
	records = [];
	create.mockImplementation(
		async ({
			data,
		}: {
			data: {
				name: string;
				nameKey: string;
				members: { create: { name: string; phone: string } };
			};
		}) => {
			if (records.some((entry) => entry.nameKey === data.nameKey)) {
				throw new Prisma.PrismaClientKnownRequestError("Unique name", {
					code: "P2002",
					clientVersion: "test",
					meta: { target: ["nameKey"] },
				});
			}
			if (
				records.some((entry) =>
					entry.members.some(
						(member) => member.phone === data.members.create.phone
					)
				)
			) {
				throw new Prisma.PrismaClientKnownRequestError("Unique phone", {
					code: "P2002",
					clientVersion: "test",
					meta: { target: ["phone"] },
				});
			}
			const record = {
				id: `subcontractor-${records.length + 1}`,
				name: data.name,
				nameKey: data.nameKey,
				members: [
					{ id: `member-${records.length + 1}`, ...data.members.create },
				],
			};
			records.push(record);
			return { id: record.id, name: record.name, members: record.members };
		}
	);
	findMember.mockImplementation(
		async ({ where }: { where: { phone: string } }) => {
			const record = records.find((entry) =>
				entry.members.some((member) => member.phone === where.phone)
			);
			return record
				? { subcontractor: { id: record.id, name: record.name } }
				: null;
		}
	);
	findUnique.mockImplementation(
		async ({ where }: { where: { id: string } }) => {
			const record = records.find((entry) => entry.id === where.id);
			return record
				? { id: record.id, name: record.name, members: record.members }
				: null;
		}
	);
});

describe("Create a Subcontractor over HTTP", () => {
	it("creates a Subcontractor with its first Member and reads back trimmed names and stored E.164", async () => {
		const response = await request(app)
			.post("/api/v1/subcontractors")
			.set("Authorization", `Bearer ${token}`)
			.send({
				name: " Acme Fitout ",
				member: { name: " Alex Tan ", phone: "9123 4567" },
			});
		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			data: {
				id: "subcontractor-1",
				name: "Acme Fitout",
				members: [{ id: "member-1", name: "Alex Tan", phone: "+6591234567" }],
			},
		});
		const detail = await request(app)
			.get("/api/v1/subcontractors/subcontractor-1")
			.set("Authorization", `Bearer ${token}`);
		expect(detail.body).toEqual(response.body);
	});
});

const validBody = {
	name: "Acme Fitout",
	member: { name: "Alex Tan", phone: "9123 4567" },
};
it.each([" acME FITOUT ", "Acme  Fitout", "Acme\tFitout"])(
	"rejects a taken normalized name: %s",
	async (name) => {
		await request(app)
			.post("/api/v1/subcontractors")
			.set("Authorization", `Bearer ${token}`)
			.send(validBody);
		const response = await request(app)
			.post("/api/v1/subcontractors")
			.set("Authorization", `Bearer ${token}`)
			.send({
				...validBody,
				name,
				member: { name: "Mei", phone: "9234 5678" },
			});
		expect(response.status).toBe(409);
		expect(response.body.error.code).toBe("SUBCONTRACTOR_NAME_TAKEN");
	}
);
it("reports the Subcontractor holding a normalized duplicate phone and leaves no partial Subcontractor", async () => {
	await request(app)
		.post("/api/v1/subcontractors")
		.set("Authorization", `Bearer ${token}`)
		.send(validBody);
	const response = await request(app)
		.post("/api/v1/subcontractors")
		.set("Authorization", `Bearer ${token}`)
		.send({
			name: "Beacon Joinery",
			member: { name: "Mei", phone: "0065 (9123)-4567" },
		});
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "MEMBER_PHONE_TAKEN",
		details: {
			subcontractorId: "subcontractor-1",
			subcontractorName: "Acme Fitout",
		},
	});
	const absent = await request(app)
		.get("/api/v1/subcontractors/subcontractor-2")
		.set("Authorization", `Bearer ${token}`);
	expect(absent.status).toBe(404);
});

it.each([
	[{ name: " ", member: { name: "Alex", phone: "9123 4567" } }, "name"],
	[{ name: "Acme", member: { name: " ", phone: "9123 4567" } }, "member"],
	[{ name: "Acme", member: { name: "Alex", phone: " " } }, "member"],
	[{ name: "Acme", member: { name: "Alex", phone: "123" } }, "member"],
	[{ name: "Acme", member: { name: "Alex", phone: "+012345678" } }, "member"],
	[{ name: "Acme" }, "member"],
])(
	"returns field errors for invalid creation input %j",
	async (body, field) => {
		const response = await request(app)
			.post("/api/v1/subcontractors")
			.set("Authorization", `Bearer ${token}`)
			.send(body);
		expect(response.status).toBe(400);
		expect(response.body.error.details.fieldErrors).toHaveProperty(
			field as string
		);
	}
);
it.each([undefined, "invalid-token"])(
	"requires a verified Session (%s)",
	async (bearer) => {
		const call = request(app).post("/api/v1/subcontractors").send(validBody);
		if (bearer) call.set("Authorization", `Bearer ${bearer}`);
		const response = await call;
		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	}
);
it("does not translate unrelated database failures into conflicts", async () => {
	create.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("Unknown unique constraint", {
			code: "P2002",
			clientVersion: "test",
			meta: { target: ["id"] },
		})
	);
	const response = await request(app)
		.post("/api/v1/subcontractors")
		.set("Authorization", `Bearer ${token}`)
		.send(validBody);
	expect(response.status).toBe(500);
	expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
});
it("documents guarded creation, validation, conflicts and the full response", async () => {
	const response = await request(app).get("/openapi.json");
	const operation = response.body.paths["/api/v1/subcontractors"]?.post;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	expect(operation.responses).toHaveProperty("400");
	expect(operation.responses).toHaveProperty("409");
	expect(
		operation.responses[201].content["application/json"].schema.properties.data
	).toEqual({ $ref: "#/components/schemas/Subcontractor" });
});
