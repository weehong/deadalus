import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Prisma is mocked so the route stack (validation middleware, controller,
// error handler, response envelope) can be exercised without a live database.
const findMany = vi.fn();
const create = vi.fn();

vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		match: {
			findMany: (...args: Array<unknown>) => findMany(...args),
			create: (...args: Array<unknown>) => create(...args),
		},
		$queryRaw: vi.fn(),
	},
}));

const { createApp } = await import("@/app.js");

const app = createApp();

const record = {
	id: "match-1",
	homeTeam: "Lisbon",
	awayTeam: "Porto",
	homeScore: 2,
	awayScore: 1,
	playedOn: new Date("2026-08-02T19:30:00.000Z"),
};

beforeEach(() => {
	findMany.mockReset();
	create.mockReset();
});

describe("GET /api/v1/matches", () => {
	it("returns 200 with an array in the data envelope", async () => {
		findMany.mockResolvedValue([record]);

		const response = await request(app).get("/api/v1/matches");

		expect(response.status).toBe(200);
		expect(Array.isArray(response.body.data)).toBe(true);
		expect(response.body.data[0]).toMatchObject({
			id: "match-1",
			homeTeam: "Lisbon",
			playedOn: "2026-08-02T19:30:00.000Z",
		});
	});
});

describe("POST /api/v1/matches", () => {
	it("returns 201 with the created match", async () => {
		create.mockResolvedValue(record);

		const response = await request(app)
			.post("/api/v1/matches")
			.send({ homeTeam: "Lisbon", awayTeam: "Porto" });

		expect(response.status).toBe(201);
		expect(response.body).toMatchObject({ data: { id: "match-1" } });
	});

	it("returns 400 with field errors when the body is invalid", async () => {
		const response = await request(app)
			.post("/api/v1/matches")
			.send({ homeTeam: "" });

		expect(response.status).toBe(400);
		expect(response.body.error.code).toBe("BAD_REQUEST");
		expect(response.body.error.details.fieldErrors).toHaveProperty("homeTeam");
		expect(response.body.error.details.fieldErrors).toHaveProperty("awayTeam");
		expect(create).not.toHaveBeenCalled();
	});
});

describe("GET /openapi.json", () => {
	it("documents the matches paths", async () => {
		const response = await request(app).get("/openapi.json");

		expect(response.status).toBe(200);
		expect(response.body.paths).toHaveProperty("/api/v1/matches");
	});
});
