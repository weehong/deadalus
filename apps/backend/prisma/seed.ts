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
		const unitIds: Array<string> = [];
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
					unitIds.push(unitId);
				}
			}
		}
		// Items and Progression (ADR-0008): Catalogue Items, an Item in the
		// seeded Units, two Assignments and a few Progress entries, all with
		// fixed ids so a re-run replaces rather than duplicates. Entries are
		// append-only, so the seeded Items' entries are replaced wholesale and
		// each Item's stored Progression is its latest seeded entry.
		const catalogueItems = [
			{ id: "seed-catalogue-item-1", name: "Kitchen cabinet" },
			{ id: "seed-catalogue-item-2", name: "Wardrobe" },
			{ id: "seed-catalogue-item-3", name: "Sink" },
		];
		for (const { id, name } of catalogueItems) {
			const data = { projectId, name, nameKey: nameKey(name) };
			await transaction.catalogueItem.upsert({
				where: { id },
				create: { id, ...data },
				update: data,
			});
		}
		const inBlockA = (unitId: string): boolean =>
			unitId.startsWith("seed-block-1-");
		/** Kitchen cabinet and Wardrobe in every Unit; Sink in Block A, Storey 01 only. */
		const holds = (unitId: string, catalogueItemId: string): boolean =>
			catalogueItemId !== "seed-catalogue-item-3" ||
			unitId.startsWith("seed-block-1-storey-1-");
		/** Block A's Kitchen cabinets go to Acme Fitout and its Wardrobes to Beacon Joinery. */
		const assignedTo = new Map([
			["seed-catalogue-item-1", "seed-subcontractor-01"],
			["seed-catalogue-item-2", "seed-subcontractor-02"],
		]);
		const items = unitIds.flatMap((unitId) =>
			catalogueItems
				.filter(({ id }) => holds(unitId, id))
				.map(({ id: catalogueItemId }, index) => ({
					id: `${unitId}-item-${index + 1}`,
					unitId,
					catalogueItemId,
					subcontractorId: inBlockA(unitId)
						? (assignedTo.get(catalogueItemId) ?? null)
						: null,
				}))
		);
		const administrator = {
			enteredByKind: "administrator" as const,
			enteredById: "seed-administrator",
			enteredByName: "administrator@example.com",
			subcontractorName: null,
		};
		const alex = {
			enteredByKind: "member" as const,
			enteredById: "seed-member-01",
			enteredByName: "Alex Tan",
			subcontractorName: "Acme Fitout",
		};
		const mei = {
			enteredByKind: "member" as const,
			enteredById: "seed-member-02",
			enteredByName: "Mei Lim",
			subcontractorName: "Beacon Joinery",
		};
		const entries = [
			{
				id: "seed-entry-01",
				itemId: "seed-block-1-storey-1-unit-1-item-1",
				value: 40,
				note: "Carcass fixed",
				...administrator,
				createdAt: new Date("2026-09-03T09:00:00.000Z"),
			},
			{
				id: "seed-entry-02",
				itemId: "seed-block-1-storey-1-unit-1-item-1",
				value: 75,
				note: null,
				...alex,
				createdAt: new Date("2026-09-08T10:30:00.000Z"),
			},
			{
				id: "seed-entry-03",
				itemId: "seed-block-1-storey-1-unit-2-item-1",
				value: 20,
				note: null,
				...alex,
				createdAt: new Date("2026-09-08T10:45:00.000Z"),
			},
			{
				id: "seed-entry-04",
				itemId: "seed-block-1-storey-2-unit-1-item-2",
				value: 50,
				note: "Doors hung",
				...mei,
				createdAt: new Date("2026-09-09T14:00:00.000Z"),
			},
			{
				id: "seed-entry-05",
				itemId: "seed-block-1-storey-2-unit-2-item-2",
				value: 100,
				note: null,
				...administrator,
				createdAt: new Date("2026-09-10T16:20:00.000Z"),
			},
		];
		/** The Item's Progression is its latest entry by createdAt then id, and 0 with none. */
		const progressionOf = (itemId: string): number =>
			entries
				.filter((entry) => entry.itemId === itemId)
				.sort(
					(a, b) =>
						b.createdAt.getTime() - a.createdAt.getTime() ||
						b.id.localeCompare(a.id)
				)[0]?.value ?? 0;
		for (const { id, ...item } of items) {
			const data = {
				...item,
				assignedAt: item.subcontractorId
					? new Date("2026-09-01T09:00:00.000Z")
					: null,
				progression: progressionOf(id),
			};
			await transaction.item.upsert({
				where: { id },
				create: { id, ...data },
				update: data,
			});
		}
		await transaction.progressEntry.deleteMany({
			where: { itemId: { in: items.map((item) => item.id) } },
		});
		await transaction.progressEntry.createMany({ data: entries });
	});
	process.stdout.write(
		`Seeded ${MATCHES.length.toString()} matches and ${subcontractors.length.toString()} Subcontractors, plus one Project with 2 Blocks, 4 Storeys, 8 Units, 2 Unit Types, 3 Catalogue Items, 18 Items, 8 Assignments and 5 Progress entries.\n`
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
