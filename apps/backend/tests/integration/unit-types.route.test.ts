import { Prisma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

interface TypeRecord {
	id: string;
	projectId: string;
	code: string;
	codeKey: string;
	description: string | null;
}
let records: Array<TypeRecord>;
let unitCount: number;
const findUnique = vi.fn();
const create = vi.fn();
const findFirst = vi.fn();
const update = vi.fn();
const remove = vi.fn();
const count = vi.fn();
const database = {
	project: { findUnique },
	unitType: { create, findFirst, update, delete: remove },
	unit: { count },
};
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		...database,
		$transaction: async (callback: (tx: typeof database) => Promise<unknown>) =>
			callback(database),
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
	for (const mock of [findUnique, create, findFirst, update, remove, count])
		mock.mockReset();
	records = [];
	unitCount = 0;
	findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
		where.id === "p1" || where.id === "p2"
			? {
					id: where.id,
					name: "Gardens",
					code: "EG2",
					blocks: [],
					unitTypes: records
						.filter((r) => r.projectId === where.id)
						.map(({ id, code, description }) => ({
							id,
							code,
							description,
							_count: { units: unitCount },
						})),
				}
			: null
	);
	findFirst.mockImplementation(
		async ({ where }: { where: { id: string; projectId: string } }) =>
			records.find(
				(r) => r.id === where.id && r.projectId === where.projectId
			) ?? null
	);
	create.mockImplementation(
		async ({ data }: { data: Omit<TypeRecord, "id"> }) => {
			if (
				records.some(
					(r) => r.projectId === data.projectId && r.codeKey === data.codeKey
				)
			)
				throw new Prisma.PrismaClientKnownRequestError("duplicate", {
					code: "P2002",
					clientVersion: "test",
					meta: { target: ["projectId", "codeKey"] },
				});
			const record = { ...data, id: `type-${records.length + 1}` };
			records.push(record);
			return record;
		}
	);
	update.mockImplementation(
		async ({
			where,
			data,
		}: {
			where: { id: string; projectId: string };
			data: Partial<TypeRecord>;
		}) => {
			const record = records.find(
				(r) => r.id === where.id && r.projectId === where.projectId
			)!;
			if (
				records.some(
					(r) =>
						r.id !== where.id &&
						r.projectId === where.projectId &&
						r.codeKey === data.codeKey
				)
			)
				throw new Prisma.PrismaClientKnownRequestError("duplicate", {
					code: "P2002",
					clientVersion: "test",
					meta: { target: ["projectId", "codeKey"] },
				});
			Object.assign(record, data);
			return record;
		}
	);
	count.mockImplementation(async () => unitCount);
	remove.mockImplementation(
		async ({ where }: { where: { id: string; projectId: string } }) => {
			records = records.filter(
				(r) => !(r.id === where.id && r.projectId === where.projectId)
			);
			return {};
		}
	);
});
const add = (body: object, projectId = "p1"): request.Test =>
	request(app)
		.post(`/api/v1/projects/${projectId}/unit-types`)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
it("adds a Unit Type preserving developer qualifiers and returns the full Project", async () => {
	const response = await add({ code: "BP2(p) (M)" });
	expect(response.status).toBe(201);
	expect(response.body).toEqual({
		data: {
			id: "p1",
			name: "Gardens",
			code: "EG2",
			blocks: [],
			unitTypes: [
				{ id: "type-1", code: "BP2(p) (M)", description: null, unitCount: 0 },
			],
		},
	});
});
it.each([" bp2(P) (m) ", "BP2\t(p)\n(M)", "bp2\u00a0(p)\u2003(m)"])(
	"rejects a code differing only by case or whitespace: %s",
	async (code) => {
		await add({ code: "BP2(p) (M)" });
		const response = await add({ code });
		expect(response.status).toBe(409);
		expect(response.body.error.code).toBe("UNIT_TYPE_CODE_TAKEN");
	}
);
it.each([
	{ code: " " },
	{ code: "a".repeat(41) },
	{ code: "AS1", description: "a".repeat(121) },
])("rejects invalid fields: %j", async (body) => {
	expect((await add(body)).status).toBe(400);
});
it("allows the same code in different Projects and rejects an unknown Project", async () => {
	await add({ code: "AS1" });
	expect((await add({ code: "as1" }, "p2")).status).toBe(201);
	expect((await add({ code: "AS1" }, "missing")).status).toBe(404);
});
const edit = (body: object, projectId = "p1", id = "type-1"): request.Test =>
	request(app)
		.patch(`/api/v1/projects/${projectId}/unit-types/${id}`)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
it("edits code or description independently, clearing with null or blank", async () => {
	await add({ code: "AS1", description: "1 Bedroom" });
	let response = await edit({ code: "BP2(p)" });
	expect(response.status).toBe(200);
	expect(response.body.data.unitTypes[0]).toMatchObject({
		code: "BP2(p)",
		description: "1 Bedroom",
	});
	response = await edit({ description: "2 Bedroom" });
	expect(response.body.data.unitTypes[0]).toMatchObject({
		code: "BP2(p)",
		description: "2 Bedroom",
	});
	for (const description of [null, ""]) {
		response = await edit({ description });
		expect(response.status).toBe(200);
		expect(response.body.data.unitTypes[0].description).toBeNull();
	}
	response = await edit({ code: "PH", description: "Penthouse" });
	expect(response.body.data.unitTypes[0]).toMatchObject({
		code: "PH",
		description: "Penthouse",
	});
});
it("refuses a taken edit and a Unit Type of another Project", async () => {
	await add({ code: "AS1" });
	await add({ code: "BP2(p)" });
	const clash = await edit({ code: "bp2 (P)" });
	expect(clash.status).toBe(409);
	expect(clash.body.error.code).toBe("UNIT_TYPE_CODE_TAKEN");
	expect((await edit({ code: "PH" }, "p2")).status).toBe(404);
	expect((await edit({ code: "PH" }, "p1", "missing")).status).toBe(404);
});
it.each([
	{},
	{ code: " " },
	{ code: "a".repeat(41) },
	{ description: "a".repeat(121) },
])("rejects invalid edits: %j", async (body) => {
	await add({ code: "AS1" });
	expect((await edit(body)).status).toBe(400);
});
const deleteType = (projectId = "p1", id = "type-1"): request.Test =>
	request(app)
		.delete(`/api/v1/projects/${projectId}/unit-types/${id}`)
		.set("Authorization", `Bearer ${token}`);
it("refuses deleting a Unit Type in use with its count, then deletes when unused", async () => {
	await add({ code: "AS1" });
	unitCount = 3;
	const refused = await deleteType();
	expect(refused.status).toBe(409);
	expect(refused.body.error).toMatchObject({
		code: "UNIT_TYPE_IN_USE",
		details: { unitCount: 3 },
	});
	unitCount = 0;
	expect((await deleteType()).status).toBe(204);
	expect((await deleteType()).status).toBe(404);
});
it("does not delete another Project's Unit Type", async () => {
	await add({ code: "AS1" });
	expect((await deleteType("p2")).status).toBe(404);
	expect((await deleteType()).status).toBe(204);
});
it("reports the current count if a Unit starts using the type between the precheck and delete", async () => {
	await add({ code: "AS1" });
	remove.mockImplementationOnce(async () => {
		unitCount = 2;
		throw new Prisma.PrismaClientKnownRequestError("restricted", {
			code: "P2003",
			clientVersion: "test",
		});
	});
	const response = await deleteType();
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "UNIT_TYPE_IN_USE",
		details: { unitCount: 2 },
	});
});
it.each(["post", "patch", "delete"] as const)(
	"requires a verified Session for %s",
	async (method) => {
		const path =
			method === "post"
				? "/api/v1/projects/p1/unit-types"
				: "/api/v1/projects/p1/unit-types/type-1";
		expect(
			(await request(app)[method](path).send({ code: "AS1" })).status
		).toBe(401);
	}
);
it("documents all Unit Type mutations with auth and their responses", async () => {
	const response = await request(app).get("/openapi.json");
	for (const [method, path, status] of [
		["post", "/api/v1/projects/{id}/unit-types", 201],
		["patch", "/api/v1/projects/{id}/unit-types/{unitTypeId}", 200],
		["delete", "/api/v1/projects/{id}/unit-types/{unitTypeId}", 204],
	] as const) {
		const operation = response.body.paths[path]?.[method];
		expect(operation).toBeDefined();
		expect(operation.security).toEqual([{ bearerAuth: [] }]);
		for (const code of [status, 400, 401, 404, 409])
			expect(operation.responses).toHaveProperty(String(code));
	}
});
