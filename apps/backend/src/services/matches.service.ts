import { prisma } from "@/lib/prisma.js";

export interface Match {
	readonly id: string;
	readonly homeTeam: string;
	readonly awayTeam: string;
	readonly homeScore: number;
	readonly awayScore: number;
	/** ISO-8601 timestamp. Serialised for transport, not a `Date`. */
	readonly playedOn: string;
}

export interface CreateMatchInput {
	readonly homeTeam: string;
	readonly awayTeam: string;
	readonly homeScore?: number;
	readonly awayScore?: number;
	readonly playedOn?: string;
}

interface MatchRecord {
	id: string;
	homeTeam: string;
	awayTeam: string;
	homeScore: number;
	awayScore: number;
	playedOn: Date;
}

/**
 * Map a persisted row onto the transport shape. Dates become ISO strings here
 * rather than relying on `JSON.stringify`, so the contract stays explicit and
 * the service is testable without a serialisation round-trip.
 */
function toMatch(record: MatchRecord): Match {
	return {
		id: record.id,
		homeTeam: record.homeTeam,
		awayTeam: record.awayTeam,
		homeScore: record.homeScore,
		awayScore: record.awayScore,
		playedOn: record.playedOn.toISOString(),
	};
}

/** List matches, most recently played first. */
export async function listMatches(): Promise<Array<Match>> {
	const records = await prisma.match.findMany({
		orderBy: { playedOn: "desc" },
	});

	return records.map((record) => toMatch(record));
}

/**
 * Create a match. Scores default to 0 and `playedOn` to now, mirroring the
 * frontend form, which collects only the two team names.
 */
export async function createMatch(input: CreateMatchInput): Promise<Match> {
	const record = await prisma.match.create({
		data: {
			homeTeam: input.homeTeam,
			awayTeam: input.awayTeam,
			homeScore: input.homeScore ?? 0,
			awayScore: input.awayScore ?? 0,
			playedOn: input.playedOn ? new Date(input.playedOn) : new Date(),
		},
	});

	return toMatch(record);
}
