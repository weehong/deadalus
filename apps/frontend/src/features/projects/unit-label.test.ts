import { describe, expect, it } from "vitest";
import { unitLabel } from "@/features/projects/unit-label";

describe("unitLabel", () => {
	it.each([
		["a numbered Storey", "12", "01", "#12-01"],
		["a ground Storey", "G", "05", "#G-05"],
		["a three-digit Unit name", "12", "114", "#12-114"],
		[
			"manual names with spaces",
			"Podium Level",
			"Shop 1",
			"#Podium Level-Shop 1",
		],
	])("composes %s", (_label, storeyName, unitName, expected) => {
		expect(unitLabel(storeyName, unitName)).toBe(expected);
	});
});
