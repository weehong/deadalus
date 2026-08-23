/* eslint-disable camelcase -- provider-shaped fixtures */
import { fireEvent, render, screen } from "@testing-library/react";
import "@/common/i18n";
import { describe, expect, it, vi } from "vitest";
import type {
	FloorPlan,
	ScopeAssignment,
	Storey,
	Subcontractor,
	Unit,
} from "../data/database";
import { ScopeChecklist } from "./ScopeChecklist";
import { ScopeSummary } from "./ScopeSummary";
const base = { created_at: "x", updated_at: "x", site_id: "site" };
const storey = {
	...base,
	id: "s",
	name: "Ground",
	number: 0,
	level_from: 0,
	level_to: 4,
	structural_note: null,
} satisfies Storey;
const plan = {
	...base,
	id: "p",
	storey_id: "s",
	name: "Plan",
	code: "P1",
	slab_level: 0,
	gross_area: 10,
	structural_grid: null,
	source_drawing_id: null,
} satisfies FloorPlan;
const unit = {
	...base,
	id: "u",
	floor_plan_id: "p",
	code: "U1",
	room_tags: [],
	usable_area: 10,
	ceiling_height: null,
	entry_door: null,
	boundary_note: null,
	boundary_type: null,
	grid_reference: null,
	status: "vacant",
} satisfies Unit;
const selected = {
	...base,
	id: "sub",
	company_name: "Selected Co",
	trade: "M",
	contact_person: null,
	phone: null,
	email: null,
	contract_reference: null,
	default_scope_codes: ["C", "D"],
} satisfies Subcontractor;
const other = { ...selected, id: "other", company_name: "Other Co" };
const held = {
	...base,
	id: "a",
	unit_id: "u",
	subcontractor_id: "other",
	scope_code: "A",
} satisfies ScopeAssignment;
describe("scope components", () => {
	it("emits item and default-scope unit toggles and shows other holders", () => {
		const item = vi.fn();
		const whole = vi.fn();
		render(
			<ScopeChecklist
				assignments={[held]}
				floorPlans={[plan]}
				selected={selected}
				storeys={[storey]}
				subcontractors={[selected, other]}
				units={[unit]}
				onClear={vi.fn()}
				onToggleItem={item}
				onToggleUnit={whole}
			/>
		);
		fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
		expect(screen.getByText(/Other Co/)).toBeTruthy();
		fireEvent.click(screen.getByLabelText("All scope for U1"));
		expect(whole).toHaveBeenCalledWith("u", ["C", "D"]);
		fireEvent.click(screen.getByLabelText("Scope B"));
		expect(item).toHaveBeenCalledWith("u", "B", true);
	});
	it("renders grouped scope and site-wide coverage", () => {
		const own = {
			...held,
			id: "own",
			subcontractor_id: "sub",
			scope_code: "A" as const,
		};
		render(
			<ScopeSummary
				assignments={[own, held]}
				selected={selected}
				units={[unit]}
			/>
		);
		expect(screen.getByRole("heading", { name: "Scope sheet" })).toBeTruthy();
		expect(screen.getByText("Double-assigned").nextSibling?.textContent).toBe(
			"1"
		);
	});
});
