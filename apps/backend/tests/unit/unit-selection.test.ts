import { describe, expect, it } from "vitest";
import { selectUnits } from "@/services/unit-selection.js";
const units = [
	{ id: "u1", blockId: "a", storeyId: "a1", unitTypeId: "t1" },
	{ id: "u2", blockId: "a", storeyId: "a1", unitTypeId: "t2" },
	{ id: "u3", blockId: "a", storeyId: "a2", unitTypeId: "t1" },
	{ id: "u4", blockId: "b", storeyId: "b1", unitTypeId: "t2" },
	{ id: "u5", blockId: "b", storeyId: "b1", unitTypeId: null },
];
const ids = (selection: Parameters<typeof selectUnits>[1]): Array<string> =>
	selectUnits(units, selection).map((unit) => unit.id);
describe("selectUnits", () => {
	it("selects every Unit of the Project when no filter is given", () => {
		expect(ids({})).toEqual(["u1", "u2", "u3", "u4", "u5"]);
	});
	it("selects by Block, by Storey and by Unit Type", () => {
		expect(ids({ blockIds: ["b"] })).toEqual(["u4", "u5"]);
		expect(ids({ storeyIds: ["a1", "b1"] })).toEqual(["u1", "u2", "u4", "u5"]);
		expect(ids({ unitTypeIds: ["t2"] })).toEqual(["u2", "u4"]);
	});
	it("intersects every filter given", () => {
		expect(ids({ blockIds: ["a"], unitTypeIds: ["t1"] })).toEqual(["u1", "u3"]);
		expect(
			ids({ blockIds: ["a"], storeyIds: ["a2"], unitTypeIds: ["t2"] })
		).toEqual([]);
		expect(ids({ blockIds: ["a", "b"], storeyIds: ["b1"] })).toEqual([
			"u4",
			"u5",
		]);
	});
	it("never matches a Unit without a Unit Type against a Unit Type filter", () => {
		expect(ids({ unitTypeIds: ["t1", "t2"] })).toEqual([
			"u1",
			"u2",
			"u3",
			"u4",
		]);
	});
	it("keeps the Units' order and ignores repeated ids", () => {
		expect(ids({ storeyIds: ["b1", "a1", "a1"] })).toEqual([
			"u1",
			"u2",
			"u4",
			"u5",
		]);
	});
});
