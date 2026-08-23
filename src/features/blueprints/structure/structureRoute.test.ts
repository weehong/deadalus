import { describe, expect, it } from "vitest";
import { parseStructureSearch } from "./structureSearch";
describe("structure route search", () => {
	it("retains valid URL selection and rejects invalid kinds", () => {
		expect(parseStructureSearch({ id: "plan-1", kind: "floor-plan" })).toEqual({
			id: "plan-1",
			kind: "floor-plan",
		});
		expect(parseStructureSearch({ id: "x", kind: "unit" })).toEqual({
			id: "x",
			kind: undefined,
		});
	});
});
