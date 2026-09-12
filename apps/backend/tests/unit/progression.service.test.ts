import { describe, expect, it } from "vitest";
import { averageProgression, rollUp } from "@/services/progression.service.js";
describe("averageProgression", () => {
	it("is null when there are no Items beneath the node", () => {
		expect(averageProgression([])).toBeNull();
	});
	it("is the plain average of every Item, each counting equally", () => {
		expect(averageProgression([100])).toBe(100);
		expect(averageProgression([0, 0, 0])).toBe(0);
		expect(averageProgression([25, 75])).toBe(50);
		expect(averageProgression([100, 50, 0, 0])).toBe(37.5);
	});
});
describe("rollUp", () => {
	it("counts Items and entries and averages their Progression", () => {
		expect(rollUp([])).toEqual({
			itemCount: 0,
			entryCount: 0,
			progression: null,
		});
		expect(
			rollUp([
				{
					unitId: "u1",
					catalogueItemId: "c",
					subcontractorId: null,
					progression: 40,
					entryCount: 2,
				},
				{
					unitId: "u2",
					catalogueItemId: "c",
					subcontractorId: "s",
					progression: 0,
					entryCount: 0,
				},
			])
		).toEqual({ itemCount: 2, entryCount: 2, progression: 20 });
	});
});
