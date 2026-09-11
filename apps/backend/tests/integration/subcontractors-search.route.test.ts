import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

const findMany = vi.fn();
const count = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		subcontractor: { findMany, count },
		$transaction: (queries: Array<Promise<unknown>>) => Promise.all(queries),
	},
}));

interface TextFilter {
	contains: string;
	mode?: string;
}
interface DirectoryFilter {
	OR?: Array<DirectoryFilter>;
	name?: TextFilter;
	members?: { some: { name?: TextFilter; phone?: TextFilter } };
}
const records = [
	{
		id: "acme",
		name: "Acme Fitout",
		members: [{ name: "Alex Tan", phone: "+6591234567" }],
	},
	{
		id: "beacon",
		name: "Beacon Joinery",
		members: [{ name: "Mei Lim", phone: "+6592345678" }],
	},
	{
		id: "steel",
		name: "Steel 100%_Works\\North",
		members: [{ name: "Ravi_100%\\Tan", phone: "+6593456789" }],
	},
];

// This boundary fake interprets database filters, so unfiltered or incorrectly
// normalised requests produce different HTTP results, not fixed mock replies.
const contains = (value: string, filter: TextFilter): boolean => {
	// PostgreSQL LIKE treats % and _ as wildcards and backslash as an escape.
	let pattern = "";
	let escaped = false;
	for (const character of filter.contains) {
		if (!escaped && character === "\\") {
			escaped = true;
			continue;
		}
		if (!escaped && character === "%") pattern += ".*";
		else if (!escaped && character === "_") pattern += ".";
		else pattern += character.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		escaped = false;
	}
	return new RegExp(pattern, filter.mode === "insensitive" ? "i" : "").test(
		value
	);
};
const matches = (
	record: (typeof records)[number],
	filter: DirectoryFilter = {}
): boolean => {
	if (filter.OR && !filter.OR.some((branch) => matches(record, branch)))
		return false;
	if (filter.name && !contains(record.name, filter.name)) return false;
	if (filter.members) {
		const memberFilter = filter.members.some;
		return record.members.some(
			(member) =>
				(!memberFilter.name || contains(member.name, memberFilter.name)) &&
				(!memberFilter.phone || contains(member.phone, memberFilter.phone))
		);
	}
	return true;
};

let app: import("express").Application;
let token: string;
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	const { createApp } = await import("@/app.js");
	app = createApp();
	findMany.mockImplementation(
		async ({
			where,
			skip,
			take,
		}: {
			where?: DirectoryFilter;
			skip: number;
			take: number;
		}) =>
			records
				.filter((record) => matches(record, where))
				.slice(skip, skip + take)
	);
	count.mockImplementation(
		async ({ where }: { where?: DirectoryFilter } = {}) =>
			records.filter((record) => matches(record, where)).length
	);
});
afterAll(() => vi.unstubAllGlobals());

describe("Directory search over HTTP", () => {
	it.each(["%", "_", "\\"])(
		"matches literal %s in names without SQL wildcard expansion",
		async (q) => {
			const response = await request(app)
				.get("/api/v1/subcontractors")
				.query({ q })
				.set("Authorization", `Bearer ${token}`);
			expect(response.status).toBe(200);
			expect(response.body.data).toEqual([
				{
					id: "steel",
					name: "Steel 100%_Works\\North",
					memberCount: 1,
					phones: ["+6593456789"],
				},
			]);
			expect(response.body.meta.total).toBe(1);
		}
	);
	it("documents the optional search query", async () => {
		const response = await request(app).get("/openapi.json");
		expect(
			response.body.paths["/api/v1/subcontractors"].get.parameters
		).toContainEqual(
			expect.objectContaining({ name: "q", in: "query", required: false })
		);
	});
	it.each(["no matching name", "---", "00000"])(
		"returns no matches for %s, without an empty phone condition matching every Member",
		async (q) => {
			const response = await request(app)
				.get("/api/v1/subcontractors")
				.query({ q })
				.set("Authorization", `Bearer ${token}`);
			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: [],
				meta: { page: 1, pageSize: 20, total: 0 },
			});
		}
	);
	it("treats whitespace-only search as the full Directory and pages filtered results", async () => {
		const response = await request(app)
			.get("/api/v1/subcontractors")
			.query({ q: "  ", page: 2, pageSize: 1 })
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.data.map((row: { id: string }) => row.id)).toEqual([
			"beacon",
		]);
		expect(response.body.meta).toEqual({ page: 2, pageSize: 1, total: 3 });
		const filtered = await request(app)
			.get("/api/v1/subcontractors")
			.query({ q: "fitout", page: 2, pageSize: 1 })
			.set("Authorization", `Bearer ${token}`);
		expect(filtered.status).toBe(200);
		expect(filtered.body).toEqual({
			data: [],
			meta: { page: 2, pageSize: 1, total: 1 },
		});
	});
	it.each(["  leX t  ", "9123 4567", "+65 (9123)-4567", "12345"])(
		"finds a Subcontractor through its Member name or phone: %s",
		async (q) => {
			const response = await request(app)
				.get("/api/v1/subcontractors")
				.query({ q })
				.set("Authorization", `Bearer ${token}`);
			expect(response.status).toBe(200);
			expect(response.body.data).toEqual([
				{
					id: "acme",
					name: "Acme Fitout",
					memberCount: 1,
					phones: ["+6591234567"],
				},
			]);
			expect(response.body.meta.total).toBe(1);
		}
	);
	it("matches a trimmed case-insensitive Subcontractor name substring", async () => {
		const response = await request(app)
			.get("/api/v1/subcontractors")
			.query({ q: "  CmE fI  " })
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(200);
		expect(response.body.data).toEqual([
			{
				id: "acme",
				name: "Acme Fitout",
				memberCount: 1,
				phones: ["+6591234567"],
			},
		]);
		expect(response.body.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
	});
});
