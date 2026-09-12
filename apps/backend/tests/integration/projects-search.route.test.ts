import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const findMany = vi.fn();
const count = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		project: { findMany, count },
		item: { findMany: async () => [] },
		$transaction: (queries: Array<Promise<unknown>>) => Promise.all(queries),
	},
}));
interface TextFilter {
	contains: string;
	mode?: string;
}
interface ProjectsFilter {
	OR?: Array<ProjectsFilter>;
	name?: TextFilter;
	code?: TextFilter;
}
const records = [
	{ id: "eg2", name: "Evergreen Gardens", code: "EG2", blocks: [] },
	{ id: "klw", name: "Kings Lane", code: "KLW", blocks: [] },
	{ id: "steel", name: "Steel 100%_Works\\North", code: "ST", blocks: [] },
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
	filter: ProjectsFilter = {}
): boolean => {
	if (filter.OR && !filter.OR.some((branch) => matches(record, branch)))
		return false;
	if (filter.name && !contains(record.name, filter.name)) return false;
	if (filter.code && !contains(record.code, filter.code)) return false;
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
			where?: ProjectsFilter;
			skip: number;
			take: number;
		}) =>
			records
				.filter((record) => matches(record, where))
				.slice(skip, skip + take)
	);
	count.mockImplementation(
		async ({ where }: { where?: ProjectsFilter } = {}) =>
			records.filter((record) => matches(record, where)).length
	);
});
afterAll(() => vi.unstubAllGlobals());
describe("Project search over HTTP", () => {
	it.each(["  eVeRgReEn  ", " eg2 "])(
		"matches Project name or code, trimming case-insensitive input: %s",
		async (q) => {
			const response = await request(app)
				.get("/api/v1/projects")
				.query({ q })
				.set("Authorization", `Bearer ${token}`);
			expect(response.status).toBe(200);
			expect(response.body.data).toEqual([
				{
					id: "eg2",
					name: "Evergreen Gardens",
					code: "EG2",
					blockCount: 0,
					storeyCount: 0,
					unitCount: 0,
					itemCount: 0,
					progression: null,
				},
			]);
			expect(response.body.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
		}
	);
	it.each(["%", "_", "\\"])(
		"matches literal %s without wildcard expansion",
		async (q) => {
			const response = await request(app)
				.get("/api/v1/projects")
				.query({ q })
				.set("Authorization", `Bearer ${token}`);
			expect(response.body.data.map((row: { id: string }) => row.id)).toEqual([
				"steel",
			]);
			expect(response.body.meta.total).toBe(1);
		}
	);
	it("returns no matches with zero total", async () => {
		const response = await request(app)
			.get("/api/v1/projects?q=missing")
			.set("Authorization", `Bearer ${token}`);
		expect(response.body).toEqual({
			data: [],
			meta: { page: 1, pageSize: 20, total: 0 },
		});
	});
	it("treats whitespace search as an unfiltered list", async () => {
		const response = await request(app)
			.get("/api/v1/projects")
			.query({ q: "  " })
			.set("Authorization", `Bearer ${token}`);
		expect(response.body.data).toHaveLength(3);
		expect(response.body.meta.total).toBe(3);
	});
});
