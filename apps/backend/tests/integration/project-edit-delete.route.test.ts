import { Prisma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const update = vi.fn();
const remove = vi.fn();
const removeBlocks = vi.fn();
const database = {
	project: { update, delete: remove },
	block: { deleteMany: removeBlocks },
};
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		...database,
		$transaction: async (
			run: (transaction: typeof database) => Promise<unknown>
		) => run(database),
	},
}));
let app: import("express").Application;
let token: string;
const record = {
	id: "project-1",
	name: "Emerald",
	code: "EG2",
	blocks: [],
	unitTypes: [],
};
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	app = (await import("@/app.js")).createApp();
});
afterAll(() => vi.unstubAllGlobals());
beforeEach(() => {
	update.mockReset();
	remove.mockReset();
	removeBlocks.mockReset();
	update.mockImplementation(
		async ({ data }: { data: { name?: string; code?: string } }) => ({
			...record,
			name: data.name ?? record.name,
			code: data.code ?? record.code,
		})
	);
	remove.mockResolvedValue(record);
	removeBlocks.mockResolvedValue({ count: 1 });
});
it.each([
	{ name: " Renamed " },
	{ code: " new " },
	{ name: "Renamed", code: "new" },
])(
	"edits partial Project fields and returns the full Project: %j",
	async (body) => {
		const response = await request(app)
			.patch("/api/v1/projects/project-1")
			.set("Authorization", `Bearer ${token}`)
			.send(body);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				...record,
				name: body.name?.trim() ?? "Emerald",
				code: body.code?.trim().toUpperCase() ?? "EG2",
			},
		});
	}
);
it("deletes a Project after removing Blocks so typed Units cannot restrict its cascade", async () => {
	remove.mockImplementation(async () => {
		if (!removeBlocks.mock.calls.length)
			throw new Prisma.PrismaClientKnownRequestError(
				"Typed Units restrict Unit Types",
				{ code: "P2003", clientVersion: "test" }
			);
		return record;
	});
	const response = await request(app)
		.delete("/api/v1/projects/project-1")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(204);
	expect(response.text).toBe("");
	expect(removeBlocks).toHaveBeenCalledWith({
		where: { projectId: "project-1" },
	});
	expect(remove).toHaveBeenCalledOnce();
});
it.each(["patch", "delete"] as const)(
	"returns 404 when %s targets an unknown Project",
	async (method) => {
		const missing = new Prisma.PrismaClientKnownRequestError("Missing", {
			code: "P2025",
			clientVersion: "test",
		});
		update.mockRejectedValueOnce(missing);
		remove.mockRejectedValueOnce(missing);
		const call = request(app)[method]("/api/v1/projects/missing");
		const response = await call
			.set("Authorization", `Bearer ${token}`)
			.send({ name: "Renamed" });
		expect(response.status).toBe(404);
	}
);
it.each([
	{},
	{ other: true },
	{ name: " " },
	{ name: "a".repeat(61) },
	{ code: "A" },
	{ code: "BAD_2" },
	{ code: null },
])("rejects invalid edit %j", async (body) => {
	const response = await request(app)
		.patch("/api/v1/projects/project-1")
		.set("Authorization", `Bearer ${token}`)
		.send(body);
	expect(response.status).toBe(400);
	expect(update).not.toHaveBeenCalled();
});
it.each([
	["nameKey", "PROJECT_NAME_TAKEN"],
	["code", "PROJECT_CODE_TAKEN"],
])("maps edit uniqueness conflict on %s", async (field, code) => {
	update.mockRejectedValueOnce(
		new Prisma.PrismaClientKnownRequestError("Unique", {
			code: "P2002",
			clientVersion: "test",
			meta: { target: [field] },
		})
	);
	const response = await request(app)
		.patch("/api/v1/projects/project-1")
		.set("Authorization", `Bearer ${token}`)
		.send({ name: "Taken", code: "TAKEN" });
	expect(response.status).toBe(409);
	expect(response.body.error.code).toBe(code);
});
it.each(["patch", "delete"] as const)(
	"requires a verified Session to %s",
	async (method) => {
		const unauthenticated = request(app)[method]("/api/v1/projects/project-1");
		expect((await unauthenticated.send({ name: "Renamed" })).status).toBe(401);
		const invalid = request(app)[method]("/api/v1/projects/project-1");
		expect(
			(
				await invalid
					.set("Authorization", "Bearer invalid-token")
					.send({ name: "Renamed" })
			).status
		).toBe(401);
	}
);
it("documents both guarded mutations", async () => {
	const response = await request(app).get("/openapi.json");
	const path = response.body.paths["/api/v1/projects/{id}"];
	for (const method of ["patch", "delete"]) {
		expect(path[method]?.security).toEqual([{ bearerAuth: [] }]);
		expect(path[method].responses).toHaveProperty("404");
	}
	expect(path.patch.responses).toHaveProperty("409");
	expect(path.delete.responses).toHaveProperty("204");
});
