import { describe, expect, it } from "vitest";
import {
	qrLabelBlocks,
	type LabelledProject,
} from "@/features/projects/qr-labels";

const ORIGIN = "https://console.example.com";

/** Two Blocks, each stated out of order, so position alone settles the run. */
const project = (): LabelledProject => ({
	blocks: [
		{
			id: "block-b",
			name: "B",
			position: 1,
			storeys: [
				{
					name: "01",
					position: 0,
					units: [{ id: "unit-b-01-01", name: "01", position: 0 }],
				},
			],
		},
		{
			id: "block-a",
			name: "A",
			position: 0,
			storeys: [
				{
					name: "02",
					position: 1,
					units: [
						{ id: "unit-a-02-02", name: "02", position: 1 },
						{ id: "unit-a-02-01", name: "01", position: 0 },
					],
				},
				{
					name: "G",
					position: 0,
					units: [{ id: "unit-a-g-05", name: "05", position: 0 }],
				},
			],
		},
	],
});

describe("qrLabelBlocks", () => {
	it("runs the Blocks in Structure order, and within each, Storey then Unit", () => {
		expect(
			qrLabelBlocks(project(), ORIGIN).map((block) => [
				block.name,
				block.units.map((unit) => unit.label),
			])
		).toEqual([
			["A", ["#G-05", "#02-01", "#02-02"]],
			["B", ["#01-01"]],
		]);
	});

	it("gives every label the Unit's Field URL on the printing origin", () => {
		expect(qrLabelBlocks(project(), ORIGIN)[0]?.units[0]).toEqual({
			unitId: "unit-a-g-05",
			label: "#G-05",
			url: `${ORIGIN}/field/units/unit-a-g-05`,
		});
	});

	it("narrows to one Block when asked, and to none when that Block is gone", () => {
		expect(
			qrLabelBlocks(project(), ORIGIN, "block-b").map((block) => block.name)
		).toEqual(["B"]);
		expect(qrLabelBlocks(project(), ORIGIN, "block-gone")).toEqual([]);
	});

	it("keeps a Block that holds no Units, so the page can say so", () => {
		expect(
			qrLabelBlocks(
				{ blocks: [{ id: "b", name: "A", position: 0, storeys: [] }] },
				ORIGIN
			)
		).toEqual([{ id: "b", name: "A", units: [] }]);
	});
});
