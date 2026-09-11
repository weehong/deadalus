import { Prisma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
interface Member {
	id: string;
	name: string;
	phone: string;
}
interface Record {
	id: string;
	name: string;
	members: Array<Member>;
}
let records: Array<Record>;
const findUnique = vi.fn();
const create = vi.fn();
const findMember = vi.fn();
const findFirst = vi.fn();
const update = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		subcontractor: { findUnique },
		member: { create, findUnique: findMember, findFirst, update },
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
	records = [
		{
			id: "acme",
			name: "Acme",
			members: [{ id: "alex", name: "Alex", phone: "+6591234567" }],
		},
		{
			id: "beacon",
			name: "Beacon",
			members: [{ id: "mei", name: "Mei", phone: "+6592345678" }],
		},
	];
	// Stands in for the database, which orders the selected Members by name then phone.
	findUnique.mockImplementation(async ({ where }: { where: { id: string } }) => {
		const record = records.find((entry) => entry.id === where.id);
		if (!record) return null;
		return {
			...record,
			members: [...record.members].sort(
				(left, right) =>
					left.name.localeCompare(right.name) ||
					left.phone.localeCompare(right.phone)
			),
		};
	});
	create.mockImplementation(
		async ({
			data,
		}: {
			data: { subcontractorId: string; name: string; phone: string };
		}) => {
			if (
				records.some((record) =>
					record.members.some((member) => member.phone === data.phone)
				)
			)
				throw new Prisma.PrismaClientKnownRequestError("Unique phone", {
					code: "P2002",
					clientVersion: "test",
					meta: { target: ["phone"] },
				});
			const record = records.find(
				(record) => record.id === data.subcontractorId
			);
			if (!record)
				throw new Prisma.PrismaClientKnownRequestError("Missing parent", {
					code: "P2003",
					clientVersion: "test",
				});
			const member = { id: "new-member", name: data.name, phone: data.phone };
			record.members.push(member);
			return member;
		}
	);
	findFirst.mockImplementation(
		async ({ where }: { where: { id: string; subcontractorId: string } }) =>
			records
				.find((record) => record.id === where.subcontractorId)
				?.members.find((member) => member.id === where.id) ?? null
	);
	update.mockImplementation(
		async ({
			where,
			data,
		}: {
			where: { id: string; subcontractorId: string };
			data: { name?: string; phone?: string };
		}) => {
			const member = records
				.find((record) => record.id === where.subcontractorId)
				?.members.find((member) => member.id === where.id);
			if (!member)
				throw new Prisma.PrismaClientKnownRequestError("Missing Member", {
					code: "P2025",
					clientVersion: "test",
				});
			if (
				data.phone &&
				records.some((record) =>
					record.members.some(
						(other) => other.id !== member.id && other.phone === data.phone
					)
				)
			)
				throw new Prisma.PrismaClientKnownRequestError("Unique phone", {
					code: "P2002",
					clientVersion: "test",
					meta: { target: ["phone"] },
				});
			Object.assign(member, data);
			return member;
		}
	);
	findMember.mockImplementation(
		async ({ where }: { where: { phone: string } }) => {
			const record = records.find((record) =>
				record.members.some((member) => member.phone === where.phone)
			);
			return record
				? { subcontractor: { id: record.id, name: record.name } }
				: null;
		}
	);
});
it("adds a Member and returns the full Subcontractor with sorted, normalized Members", async () => {
	const response = await request(app)
		.post("/api/v1/subcontractors/acme/members")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: " Aaron ", phone: "0065 (9345)-6789" });
	expect(response.status).toBe(201);
	expect(response.body).toEqual({
		data: {
			id: "acme",
			name: "Acme",
			members: [
				{ id: "new-member", name: "Aaron", phone: "+6593456789" },
				{ id: "alex", name: "Alex", phone: "+6591234567" },
			],
		},
	});
});

it("edits either Member field while preserving omitted values and allowing its own phone", async () => {
	const renamed = await request(app)
		.patch("/api/v1/subcontractors/acme/members/alex")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: " Alex Tan " });
	expect(renamed.status).toBe(200);
	expect(renamed.body.data.members).toEqual([
		{ id: "alex", name: "Alex Tan", phone: "+6591234567" },
	]);
	const phone = await request(app)
		.patch("/api/v1/subcontractors/acme/members/alex")
		.set("Authorization", `Bearer ${token}`)
		.send({ phone: "9123 4567" });
	expect(phone.status).toBe(200);
	expect(phone.body).toEqual(renamed.body);
});

it.each(["post", "patch"] as const)(
	"%s refuses missing and invalid tokens",
	async (method) => {
		for (const bearer of [undefined, "invalid-token"]) {
			const client = request(app);
			const call = client[method](
				`/api/v1/subcontractors/acme/members${method === "patch" ? "/alex" : ""}`
			).send({ name: "Aaron", phone: "9345 6789" });
			if (bearer) call.set("Authorization", `Bearer ${bearer}`);
			expect((await call).status).toBe(401);
		}
	}
);
it.each([
	{},
	{ name: "Aaron" },
	{ phone: "9345 6789" },
	{ name: " ", phone: "9345 6789" },
	{ name: "Aaron", phone: "123" },
	{ name: "Aaron", phone: "" },
])("add validates %j", async (body) => {
	const response = await request(app)
		.post("/api/v1/subcontractors/acme/members")
		.set("Authorization", `Bearer ${token}`)
		.send(body);
	expect(response.status).toBe(400);
});
it.each([
	{},
	{ ignored: "value" },
	{ name: " " },
	{ phone: "123" },
	{ phone: null },
])("edit validates %j", async (body) => {
	const response = await request(app)
		.patch("/api/v1/subcontractors/acme/members/alex")
		.set("Authorization", `Bearer ${token}`)
		.send(body);
	expect(response.status).toBe(400);
});
it("add refuses an unknown Subcontractor", async () => {
	const response = await request(app)
		.post("/api/v1/subcontractors/missing/members")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "Aaron", phone: "9345 6789" });
	expect(response.status).toBe(404);
});
it.each(["acme/members/mei", "acme/members/missing", "missing/members/alex"])(
	"edit resolves both ids: %s",
	async (path) => {
		const response = await request(app)
			.patch(`/api/v1/subcontractors/${path}`)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "Changed" });
		expect(response.status).toBe(404);
		const detail = await request(app)
			.get("/api/v1/subcontractors/beacon")
			.set("Authorization", `Bearer ${token}`);
		expect(detail.body.data.members).toEqual([
			{ id: "mei", name: "Mei", phone: "+6592345678" },
		]);
	}
);
it.each(["post", "patch"] as const)(
	"%s reports global phone conflicts and preserves saved values",
	async (method) => {
		const client = request(app);
		const response = await client[method](
			`/api/v1/subcontractors/acme/members${method === "patch" ? "/alex" : ""}`
		)
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "Aaron", phone: "0065 (9234)-5678" });
		expect(response.status).toBe(409);
		expect(response.body.error).toMatchObject({
			code: "MEMBER_PHONE_TAKEN",
			details: { subcontractorId: "beacon", subcontractorName: "Beacon" },
		});
		const detail = await request(app)
			.get("/api/v1/subcontractors/acme")
			.set("Authorization", `Bearer ${token}`);
		expect(detail.body.data.members).toEqual([
			{ id: "alex", name: "Alex", phone: "+6591234567" },
		]);
	}
);
it("also refuses a duplicate phone inside the same Subcontractor", async () => {
	const response = await request(app)
		.post("/api/v1/subcontractors/acme/members")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "Aaron", phone: "9123 4567" });
	expect(response.status).toBe(409);
	expect(response.body.error.details.subcontractorName).toBe("Acme");
});
it("documents authenticated Member writes and their response contracts", async () => {
	const response = await request(app).get("/openapi.json");
	for (const [path, method, status] of [
		["/api/v1/subcontractors/{id}/members", "post", "201"],
		["/api/v1/subcontractors/{id}/members/{memberId}", "patch", "200"],
	] as const) {
		const operation = response.body.paths[path]?.[method];
		expect(operation).toBeDefined();
		expect(operation.security).toEqual([{ bearerAuth: [] }]);
		for (const code of [status, "400", "401", "404", "409"])
			expect(operation.responses).toHaveProperty(code);
		expect(
			operation.responses[status].content["application/json"].schema.properties
				.data
		).toEqual({ $ref: "#/components/schemas/Subcontractor" });
	}
});
