import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { utils, write } from "xlsx";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const findUnique = vi.fn();
vi.mock("@/lib/prisma.js", () => ({ prisma: { project: { findUnique } } }));
let app: import("express").Application;
let token: string;
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	app = (await import("@/app.js")).createApp();
});
beforeEach(() => {
	findUnique.mockResolvedValue({ id: "garden" });
});
afterAll(() => vi.unstubAllGlobals());
const endpoint = "/api/v1/projects/garden/unit-matrix/parse";
it("requires a Session before accepting multipart data", async () => {
	expect(
		(
			await request(app)
				.post(endpoint)
				.attach("file", Buffer.from("test"), "book.xlsx")
		).status
	).toBe(401);
});
it("returns unknown Project before parsing", async () => {
	findUnique.mockResolvedValue(null);
	expect(
		(await request(app).post(endpoint).set("Authorization", `Bearer ${token}`))
			.status
	).toBe(404);
});
it("rejects missing file", async () => {
	expect(
		(await request(app).post(endpoint).set("Authorization", `Bearer ${token}`))
			.status
	).toBe(400);
});
it.each([
	["wrong.csv", Buffer.from("a,b"), "BAD_REQUEST"],
	["large.xlsx", Buffer.alloc(10 * 1024 * 1024 + 1), "BAD_REQUEST"],
	["text.xlsx", Buffer.from("ordinary text"), "UNIT_MATRIX_UNREADABLE"],
])("refuses %s with an actionable code", async (name, buffer, code) => {
	const response = await request(app)
		.post(endpoint)
		.set("Authorization", `Bearer ${token}`)
		.attach("file", buffer as Buffer, name as string);
	expect(response.status).toBe(400);
	expect(response.body.error.code).toBe(code);
});
it("returns every sheet without storing anything", async () => {
	const book = utils.book_new();
	utils.book_append_sheet(
		book,
		utils.aoa_to_sheet([
			[null, "North"],
			["Storey", 1, 2],
			[1, "A", "B"],
		]),
		"Matrix"
	);
	utils.book_append_sheet(book, utils.aoa_to_sheet([["Notes"]]), "Notes");
	const response = await request(app)
		.post(endpoint)
		.set("Authorization", `Bearer ${token}`)
		.attach(
			"file",
			write(book, { type: "buffer", bookType: "xlsx" }) as Buffer,
			"invented.xlsx"
		);
	expect(response.status).toBe(200);
	expect(response.body.data.sheets).toMatchObject([
		{ name: "Matrix", blocks: [{ name: "North", unitCount: 2 }] },
		{ name: "Notes", blocks: [] },
	]);
});
it("documents the guarded multipart route and response", async () => {
	const response = await request(app).get("/openapi.json");
	const route =
		response.body.paths["/api/v1/projects/{id}/unit-matrix/parse"]?.post;
	expect(route?.security).toEqual([{ bearerAuth: [] }]);
	expect(route?.requestBody.content).toHaveProperty("multipart/form-data");
	expect(route?.responses).toHaveProperty("400");
});
it("returns stable warning codes with structured labels through multipart HTTP", async () => {
	const book = utils.book_new();
	utils.book_append_sheet(
		book,
		utils.aoa_to_sheet([[null, "North"], [null, 3, 5], [2, "A", "B"], [1]]),
		"Schedule"
	);
	const response = await request(app)
		.post(endpoint)
		.set("Authorization", `Bearer ${token}`)
		.attach(
			"file",
			write(book, { type: "buffer", bookType: "xlsx" }) as Buffer,
			"invented.xlsx"
		);
	expect(response.status).toBe(200);
	expect(response.body.data.sheets[0].blocks[0]).toMatchObject({
		unitCount: 2,
		warnings: [
			{ code: "NON_CONSECUTIVE_STACKS" },
			{ code: "EMPTY_STOREY", label: "1" },
		],
	});
});
it("documents every stable warning code and its original Storey label", async () => {
	const response = await request(app).get("/openapi.json");
	const schema =
		response.body.paths["/api/v1/projects/{id}/unit-matrix/parse"].post
			.responses["200"].content["application/json"].schema;
	const warning =
		schema.properties.data.properties.sheets.items.properties.blocks.items
			.properties.warnings.items;
	expect(warning.properties.code.enum).toEqual([
		"EMPTY_STOREY",
		"DUPLICATE_STOREY",
		"NON_CONSECUTIVE_STACKS",
		"INFERRED_STACKS",
		"EMPTY_BLOCK",
	]);
	expect(warning.properties.label.description).toContain(
		"Original workbook Storey label"
	);
});
