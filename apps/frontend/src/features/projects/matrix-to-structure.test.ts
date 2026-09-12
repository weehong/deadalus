import { expect, it } from "vitest";
import {
	matrixToStructure,
	matrixErrors,
	newUnitTypeCodes,
	omittedStoreys,
	blockNameErrors,
} from "@/features/projects/matrix-to-structure";
it("creates one Unit per filled cell, pads stacks and omits nulls including merged followers", () => {
	expect(
		matrixToStructure([
			{
				name: "West",
				stacks: ["1", "2", "3"],
				storeys: [
					{ name: "01", cells: ["A", null, "PH"] },
					{ name: "02", cells: [null, null, null] },
				],
				unitCount: 2,
				warnings: [],
			},
		])
	).toEqual({
		blocks: [
			{
				name: "West",
				storeys: [
					{
						name: "01",
						units: [
							{ name: "01", unitTypeCode: "A" },
							{ name: "03", unitTypeCode: "PH" },
						],
					},
				],
			},
		],
	});
});
it("reports both normalized duplicate headers and blank names, ignoring unticked Blocks", () => {
	expect(
		blockNameErrors([
			{ name: "West", included: true },
			{ name: " west ", included: true },
			{ name: " ", included: true },
			{ name: "West", included: false },
		])
	).toEqual(["duplicate", "duplicate", "invalid", undefined]);
});
it("points to normalized duplicate Storeys and padded duplicate Units, including blank row names", () => {
	expect(
		matrixErrors([
			{
				name: "West",
				stacks: ["1", "01"],
				storeys: [
					{ name: " Roof ", cells: ["A", "B"] },
					{ name: "roof", cells: [null, "C"] },
					{ name: " ", cells: [null, null] },
				],
				unitCount: 4,
				warnings: [],
			},
		])
	).toEqual(
		expect.arrayContaining([
			{ code: "duplicateStorey", block: 0, row: 0 },
			{ code: "duplicateStorey", block: 0, row: 1 },
			{ code: "invalidStorey", block: 0, row: 2 },
			{ code: "duplicateUnit", block: 0, row: 0, column: 0 },
			{ code: "duplicateUnit", block: 0, row: 0, column: 1 },
		])
	);
	expect(matrixErrors([])).toEqual([{ code: "noBlocks" }]);
});
it("uses whitespace-free uppercase code keys, keeping qualifiers and the first spelling", () => {
	const block = {
		name: "West",
		stacks: ["1", "2", "3", "4"],
		storeys: [
			{ name: "01", cells: [" BP2(p) (M) ", "bp2 (p)(m)", "A 1", "BP2(p)"] },
		],
		unitCount: 4,
		warnings: [],
	};
	expect(newUnitTypeCodes(block, ["a1"])).toEqual(["BP2(p) (M)", "BP2(p)"]);
});
it("omits cleared or whitespace-only Storeys and identifies them for the summary", () => {
	const blocks = [
		{
			name: "West",
			stacks: ["1"],
			storeys: [
				{ name: "01", cells: [" "] },
				{ name: "02", cells: [null] },
				{ name: "Roof", cells: [" PH "] },
			],
			unitCount: 1,
			warnings: [],
		},
	];
	expect(omittedStoreys(blocks)).toEqual(["West / 01", "West / 02"]);
	expect(matrixToStructure(blocks).blocks[0]?.storeys).toEqual([
		{ name: "Roof", units: [{ name: "01", unitTypeCode: "PH" }] },
	]);
});
it("accepts reused names across Blocks and empty duplicate Stack cells, but blocks invalid names and codes", () => {
	const block = {
		name: "West",
		stacks: ["1", "01"],
		storeys: [{ name: "01", cells: ["A", null] }],
		unitCount: 1,
		warnings: [],
	};
	expect(matrixErrors([block, { ...block, name: "East" }])).toEqual([]);
	expect(
		matrixErrors([
			{
				...block,
				stacks: [" ", "2"],
				storeys: [{ name: "01", cells: ["A".repeat(41), null] }],
			},
		])
	).toEqual([
		{ code: "invalidUnit", block: 0, row: 0, column: 0 },
		{ code: "invalidCode", block: 0, row: 0, column: 0 },
	]);
	expect(
		matrixErrors(
			Array.from({ length: 51 }, (_, index) => ({
				...block,
				name: String(index),
			}))
		)
	).toContainEqual({ code: "caps" });
});
