import { nameKey, unitTypeCodeKey } from "../src/lib/name-key.js";
import { prisma } from "../src/lib/prisma.js";

/**
 * Deterministic seed data for the reference slice. Fixed ids make the seed
 * idempotent (`upsert`), so re-running it never duplicates rows and the chart
 * looks the same on every machine.
 */
const MATCHES = [
	{
		id: "seed-match-01",
		homeTeam: "Lisbon",
		awayTeam: "Porto",
		homeScore: 2,
		awayScore: 1,
		playedOn: "2026-08-02T19:30:00.000Z",
	},
	{
		id: "seed-match-02",
		homeTeam: "Madrid",
		awayTeam: "Seville",
		homeScore: 0,
		awayScore: 0,
		playedOn: "2026-08-05T18:00:00.000Z",
	},
	{
		id: "seed-match-03",
		homeTeam: "Turin",
		awayTeam: "Milan",
		homeScore: 3,
		awayScore: 2,
		playedOn: "2026-08-09T20:45:00.000Z",
	},
	{
		id: "seed-match-04",
		homeTeam: "Munich",
		awayTeam: "Dortmund",
		homeScore: 1,
		awayScore: 4,
		playedOn: "2026-08-12T17:15:00.000Z",
	},
	{
		id: "seed-match-05",
		homeTeam: "Lyon",
		awayTeam: "Marseille",
		homeScore: 2,
		awayScore: 2,
		playedOn: "2026-08-16T19:00:00.000Z",
	},
	{
		id: "seed-match-06",
		homeTeam: "Amsterdam",
		awayTeam: "Rotterdam",
		homeScore: 5,
		awayScore: 0,
		playedOn: "2026-08-20T18:30:00.000Z",
	},
	{
		id: "seed-match-07",
		homeTeam: "Glasgow",
		awayTeam: "Edinburgh",
		homeScore: 1,
		awayScore: 3,
		playedOn: "2026-08-24T16:00:00.000Z",
	},
	{
		id: "seed-match-08",
		homeTeam: "Vienna",
		awayTeam: "Salzburg",
		homeScore: 4,
		awayScore: 1,
		playedOn: "2026-08-29T20:00:00.000Z",
	},
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

	const subcontractors = [
		{
			id: "seed-subcontractor-01",
			name: "Acme Fitout",
			member: { id: "seed-member-01", name: "Alex Tan", phone: "+6591234567" },
		},
		{
			id: "seed-subcontractor-02",
			name: "Beacon Joinery",
			member: { id: "seed-member-02", name: "Mei Lim", phone: "+6592345678" },
		},
		{
			id: "seed-subcontractor-03",
			name: "Cedar Installations",
			member: {
				id: "seed-member-03",
				name: "Ravi Kumar",
				phone: "+6593456789",
			},
		},
	];
	for (const { id, name, member } of subcontractors) {
		await prisma.subcontractor.upsert({
			where: { id },
			create: {
				id,
				name,
				nameKey: nameKey(name),
				members: { create: member },
			},
			update: {
				name,
				nameKey: nameKey(name),
				members: {
					upsert: { where: { id: member.id }, create: member, update: member },
				},
			},
		});
	}
	await prisma.$transaction(async (transaction) => {
		const projectId = "seed-project-01";
		const project = {
			name: "Evergreen Gardens",
			nameKey: nameKey("Evergreen Gardens"),
			code: "EG2",
		};
		await transaction.project.upsert({
			where: { id: projectId },
			create: { id: projectId, ...project },
			update: project,
		});
		for (const [index, code] of ["AS1", "BP2(p) (M)"].entries()) {
			const id = `seed-unit-type-${index + 1}`;
			const data = {
				projectId,
				code,
				codeKey: unitTypeCodeKey(code),
				description: index === 0 ? "1 Bedroom + Study" : null,
			};
			await transaction.unitType.upsert({
				where: { id },
				create: { id, ...data },
				update: data,
			});
		}
		for (const [blockIndex, name] of ["A", "B"].entries()) {
			const blockId = `seed-block-${blockIndex + 1}`;
			const block = {
				projectId,
				name,
				nameKey: nameKey(name),
				position: blockIndex + 1,
			};
			await transaction.block.upsert({
				where: { id: blockId },
				create: { id: blockId, ...block },
				update: block,
			});
			for (const [storeyIndex, storeyName] of ["01", "02"].entries()) {
				const storeyId = `${blockId}-storey-${storeyIndex + 1}`;
				const storey = {
					blockId,
					name: storeyName,
					nameKey: nameKey(storeyName),
					position: storeyIndex + 1,
				};
				await transaction.storey.upsert({
					where: { id: storeyId },
					create: { id: storeyId, ...storey },
					update: storey,
				});
				for (const [unitIndex, unitName] of ["01", "02"].entries()) {
					const unitId = `${storeyId}-unit-${unitIndex + 1}`;
					const unit = {
						storeyId,
						name: unitName,
						nameKey: nameKey(unitName),
						position: unitIndex + 1,
						unitTypeId: `seed-unit-type-${unitIndex + 1}`,
					};
					await transaction.unit.upsert({
						where: { id: unitId },
						create: { id: unitId, ...unit },
						update: unit,
					});
				}
			}
		}
	});
	process.stdout.write(
		`Seeded ${MATCHES.length.toString()} matches and ${subcontractors.length.toString()} Subcontractors, plus one Project with 2 Blocks, 4 Storeys, 8 Units and 2 Unit Types.\n`
	);
}

main()
	.catch((error: unknown) => {
		process.stderr.write(`Seed failed: ${String(error)}\n`);
		process.exitCode = 1;
	})
	.finally(() => {
		void prisma.$disconnect();
	});
