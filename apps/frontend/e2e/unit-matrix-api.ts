import type { UnitMatrixPreview } from "../src/features/projects/unitMatrixTypes";
/** Invented browser-edge response; uploaded bytes are never parsed by this fake. */
export const unitMatrixFixture = (): UnitMatrixPreview => ({
	sheets: [
		{ name: "Notes", blocks: [], warnings: [] },
		{
			name: "Schedule",
			warnings: [],
			blocks: [
				{
					name: "West",
					stacks: ["01", "02", "03", "04", "05", "06"],
					storeys: [
						{ name: "01", cells: ["A1", "A2", "A1", "A2", "A1", "A2"] },
						{ name: "02", cells: ["PH", null, "A1", "A2", "A1", "A2"] },
					],
					unitCount: 11,
					warnings: [
						{
							code: "EMPTY_STOREY",
							label: "B1",
							message: "Storey B1 was omitted because it has no Units.",
						},
					],
				},
				{
					name: "East",
					stacks: ["07", "08"],
					storeys: [{ name: "01", cells: ["B1", "B2"] }],
					unitCount: 2,
					warnings: [],
				},
			],
		},
	],
});
