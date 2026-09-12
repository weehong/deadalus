import { expect, it } from "vitest";
import {
	generateNames,
	previewNames,
} from "@/features/projects/name-generator";
it("generates prefixed padded ranges with suffixes and refuses reversed ranges", () => {
	expect(
		generateNames({
			mode: "range",
			prefix: "B",
			from: 1,
			to: 3,
			pad: 2,
			suffix: "X",
		})
	).toEqual(["B01X", "B02X", "B03X"]);
	expect(
		generateNames({
			mode: "range",
			prefix: "",
			from: 3,
			to: 1,
			pad: 0,
			suffix: "",
		})
	).toEqual([]);
});
it("trims list lines and drops blanks", () => {
	expect(generateNames({ mode: "list", text: " A \n\n B  B\r\n " })).toEqual([
		"A",
		"B  B",
	]);
});
it("marks existing and every repeated spelling", () => {
	expect(previewNames(["A", " a ", "B", "C"], ["b"])).toEqual([
		{ name: "A", existing: false, repeated: true },
		{ name: " a ", existing: false, repeated: true },
		{ name: "B", existing: true, repeated: false },
		{ name: "C", existing: false, repeated: false },
	]);
});
