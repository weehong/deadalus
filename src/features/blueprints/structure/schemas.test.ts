import { describe, expect, it } from "vitest";
import { floorPlanSchema, storeySchema, unitSchema } from "./schemas";

describe("structure schemas", () => {
	it("requires a storey name and number", () => {
		const result = storeySchema.safeParse({
			name: "",
			number: Number.NaN,
			levelFrom: 0,
			levelTo: 3,
			structuralNote: "",
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const errors = result.error.flatten().fieldErrors;
			expect(errors.name?.length).toBeGreaterThan(0);
			expect(errors.number?.length).toBeGreaterThan(0);
		}
	});

	it("requires level to to be above level from", () => {
		const result = storeySchema.safeParse({
			name: "Ground",
			number: 0,
			levelFrom: 3,
			levelTo: 3,
			structuralNote: "",
		});
		expect(result.success).toBe(false);
		if (!result.success)
			expect(result.error.flatten().fieldErrors.levelTo).toContain(
				"Level to must be above level from"
			);
	});

	it("rejects a negative floor plan gross area", () => {
		expect(
			floorPlanSchema.safeParse({
				name: "Plan",
				code: "A-01",
				storeyId: "s1",
				slabLevel: 0,
				grossArea: -1,
				structuralGrid: "",
			}).success
		).toBe(false);
	});

	it("rejects a negative unit usable area", () => {
		expect(
			unitSchema.safeParse({
				code: "U-1",
				floorPlanId: "p1",
				usableArea: -1,
				entryDoor: "",
				roomTags: "",
				boundaryNote: "",
			}).success
		).toBe(false);
	});
});
