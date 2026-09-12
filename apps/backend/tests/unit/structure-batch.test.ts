import { expect, it } from "vitest";
import { findClashingNames } from "@/services/structure-batch.js";
it("finds every normalized clash while preserving input order and spelling", () => {
	expect(findClashingNames(["B  B", "C", "A"], ["a", "b b"])).toEqual([
		"B  B",
		"A",
	]);
});
