import { beforeEach, describe, expect, it, vi } from "vitest";

// The service is exercised against a mocked Prisma client: these tests cover
// the mapping and defaulting logic, not the database. Route-level behaviour is
// covered in tests/integration/matches.route.test.ts.
const findMany = vi.fn();
const create = vi.fn();

vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		match: {
			findMany: (...args: Array<unknown>) => findMany(...args),
			create: (...args: Array<unknown>) => create(...args),
		},
	},
}));

const { createMatch, listMatches } = await import(
	"@/services/matches.service.js"
);

const record = {
	id: "match-1",
	homeTeam: "Lisbon",
	awayTeam: "Porto",
	homeScore: 2,
	awayScore: 1,
	playedOn: new Date("2026-08-02T19:30:00.000Z"),
};


interface CreatedMatchData {
	homeTeam: string;
	awayTeam: string;
	homeScore: number;
	awayScore: number;
	playedOn: Date;
}

/** The `data` payload handed to `prisma.match.create` by the last call. */
function capturedData(): CreatedMatchData {
	const call = create.mock.calls[0]?.[0] as { data: CreatedMatchData };
	return call.data;
}

beforeEach(() => {
	findMany.mockReset();
	create.mockReset();
});

describe("listMatches", () => {
	it("serialises playedOn to an ISO string", async () => {
		findMany.mockResolvedValue([record]);

		const matches = await listMatches();

		expect(matches).toEqual([
			{
				id: "match-1",
				homeTeam: "Lisbon",
				awayTeam: "Porto",
				homeScore: 2,
				awayScore: 1,
				playedOn: "2026-08-02T19:30:00.000Z",
			},
		]);
	});

	it("orders by most recently played", async () => {
		findMany.mockResolvedValue([]);

		await listMatches();

		expect(findMany).toHaveBeenCalledWith({ orderBy: { playedOn: "desc" } });
	});
});

describe("createMatch", () => {
	it("defaults scores to 0 and playedOn to now", async () => {
		create.mockResolvedValue(record);

		await createMatch({ homeTeam: "Lisbon", awayTeam: "Porto" });

		const data = capturedData();
		expect(data.homeScore).toBe(0);
		expect(data.awayScore).toBe(0);
		expect(data.playedOn).toBeInstanceOf(Date);
	});

	it("passes explicit values through, coercing playedOn to a Date", async () => {
		create.mockResolvedValue(record);

		await createMatch({
			homeTeam: "Turin",
			awayTeam: "Milan",
			homeScore: 3,
			awayScore: 2,
			playedOn: "2026-08-09T20:45:00.000Z",
		});

		const data = capturedData();
		expect(data.homeScore).toBe(3);
		expect(data.awayScore).toBe(2);
		expect(data.playedOn).toEqual(new Date("2026-08-09T20:45:00.000Z"));
	});
});
