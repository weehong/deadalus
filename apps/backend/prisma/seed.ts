import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Deterministic seed data for the reference slice. Fixed ids make the seed
 * idempotent (`upsert`), so re-running it never duplicates rows and the chart
 * looks the same on every machine.
 */
const MATCHES = [
	{ id: "seed-match-01", homeTeam: "Lisbon", awayTeam: "Porto", homeScore: 2, awayScore: 1, playedOn: "2026-08-02T19:30:00.000Z" },
	{ id: "seed-match-02", homeTeam: "Madrid", awayTeam: "Seville", homeScore: 0, awayScore: 0, playedOn: "2026-08-05T18:00:00.000Z" },
	{ id: "seed-match-03", homeTeam: "Turin", awayTeam: "Milan", homeScore: 3, awayScore: 2, playedOn: "2026-08-09T20:45:00.000Z" },
	{ id: "seed-match-04", homeTeam: "Munich", awayTeam: "Dortmund", homeScore: 1, awayScore: 4, playedOn: "2026-08-12T17:15:00.000Z" },
	{ id: "seed-match-05", homeTeam: "Lyon", awayTeam: "Marseille", homeScore: 2, awayScore: 2, playedOn: "2026-08-16T19:00:00.000Z" },
	{ id: "seed-match-06", homeTeam: "Amsterdam", awayTeam: "Rotterdam", homeScore: 5, awayScore: 0, playedOn: "2026-08-20T18:30:00.000Z" },
	{ id: "seed-match-07", homeTeam: "Glasgow", awayTeam: "Edinburgh", homeScore: 1, awayScore: 3, playedOn: "2026-08-24T16:00:00.000Z" },
	{ id: "seed-match-08", homeTeam: "Vienna", awayTeam: "Salzburg", homeScore: 4, awayScore: 1, playedOn: "2026-08-29T20:00:00.000Z" },
] as const;

async function main(): Promise<void> {
	for (const match of MATCHES) {
		const data = { ...match, playedOn: new Date(match.playedOn) };
		await prisma.match.upsert({
			where: { id: match.id },
			create: data,
			update: data,
		});
	}

	process.stdout.write(`Seeded ${MATCHES.length.toString()} matches.\n`);
}

main()
	.catch((error: unknown) => {
		process.stderr.write(`Seed failed: ${String(error)}\n`);
		process.exitCode = 1;
	})
	.finally(() => {
		void prisma.$disconnect();
	});
