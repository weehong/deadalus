/* eslint-disable camelcase -- provider-shaped fixtures */
import { describe, expect, it } from "vitest";
import type { ScopeAssignment, Subcontractor, Unit } from "../data/database";
import {
	deriveCoverage,
	deriveScopeSheet,
	otherHolders,
	unitCheckState,
	unitToggleCodes,
} from "./model";
const base = { created_at: "x", updated_at: "x" };
const unit = {
	...base,
	id: "u",
	site_id: "s",
	floor_plan_id: "p",
	code: "U1",
	room_tags: [],
	usable_area: 1,
	ceiling_height: null,
	entry_door: null,
	boundary_note: null,
	boundary_type: null,
	grid_reference: null,
	status: "vacant" as const,
} satisfies Unit;
const assignment = (
	id: string,
	subcontractor_id: string,
	scope_code: "A" | "B"
): ScopeAssignment => ({
	...base,
	id,
	site_id: "s",
	unit_id: "u",
	subcontractor_id,
	scope_code,
});
describe("scope model", () => {
	it("derives tri-state and default first toggle", () => {
		expect(unitCheckState("u", "sub", [])).toBe("none");
		expect(unitCheckState("u", "sub", [assignment("1", "sub", "A")])).toBe(
			"some"
		);
		expect(unitToggleCodes("none", ["B"])).toEqual(["B"]);
		expect(unitToggleCodes("all", ["B"])).toEqual([]);
	});
	it("groups the sheet and derives site-wide coverage", () => {
		const rows = deriveScopeSheet("sub", [unit], [assignment("1", "sub", "A")]);
		expect(rows[0]?.codes).toEqual(["A"]);
		expect(
			deriveCoverage(
				[unit],
				[assignment("1", "sub", "A"), assignment("2", "other", "A")]
			)
		).toEqual({ covered: 1, unassigned: 5, doubleAssigned: 1, total: 6 });
	});
	it("names other holders", () => {
		const other = {
			...base,
			id: "other",
			site_id: "s",
			company_name: "Acme",
			trade: "M",
			contact_person: null,
			phone: null,
			email: null,
			contract_reference: null,
			default_scope_codes: [],
		} satisfies Subcontractor;
		expect(
			otherHolders("u", "A", "sub", [assignment("1", "other", "A")], [other])
		).toEqual(["Acme"]);
	});
});
