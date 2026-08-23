/* eslint-disable camelcase -- provider-shaped fixtures */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import i18n from "@/common/i18n";
import type { FloorPlan, Storey, Unit } from "../data/database";
import { FloorPlansTable, UnitsTable } from "./StructureChildrenTable";
import { StoreyDetail } from "./StructureDetail";
import { StructureTree } from "./StructureTree";
import { StructureScreen } from "./StructureScreen";
const base = {
	created_at: "2026-01-01T00:00:00Z",
	updated_at: "2026-01-02T00:00:00Z",
};
const storey: Storey = {
	...base,
	id: "s1",
	site_id: "site",
	name: "Ground floor",
	number: 0,
	level_from: 0,
	level_to: 4.2,
	structural_note: "Transfer slab",
};
const plan: FloorPlan = {
	...base,
	id: "p1",
	site_id: "site",
	storey_id: "s1",
	name: "Ground plan",
	code: "A-GF",
	slab_level: 0,
	gross_area: 1840,
	structural_grid: "A–H",
	source_drawing_id: null,
};
const unit: Unit = {
	...base,
	id: "u1",
	site_id: "site",
	floor_plan_id: "p1",
	code: "B-G-01",
	room_tags: ["G01"],
	usable_area: 310,
	ceiling_height: 3.2,
	entry_door: "D-G01",
	boundary_note: null,
	boundary_type: null,
	grid_reference: null,
	status: "occupied",
};

describe("structure read components", () => {
	it("renders supplied actions through the page heading", () => {
		render(
			<StructureScreen
				drawings={[]}
				floorPlans={[]}
				headingActions={<button>New storey</button>}
				installations={[]}
				site={{ ...base, id: "site", name: "Site", description: null }}
				storeys={[]}
				units={[]}
				onOpenUnit={vi.fn()}
				onSelect={vi.fn()}
			/>
		);
		const heading = screen
			.getByRole("heading", { name: "Building structure" })
			.closest("header");
		expect(
			heading?.contains(screen.getByRole("button", { name: "New storey" }))
		).toBe(true);
	});
	it("exposes selected state on every visible tree item", () => {
		render(
			<StructureTree
				floorPlans={[plan]}
				selected={{ id: "p1", kind: "floor-plan" }}
				storeys={[storey]}
				units={[unit]}
				onSelect={vi.fn()}
			/>
		);
		const treeItems = screen.getAllByRole("treeitem");
		expect(treeItems).toHaveLength(2);
		expect(treeItems[0]?.getAttribute("aria-selected")).toBe("false");
		expect(treeItems[1]?.getAttribute("aria-selected")).toBe("true");
	});
	it("renders counts, selects nodes and collapses branches", () => {
		const select = vi.fn();
		const addPlan = vi.fn();
		const addUnit = vi.fn();
		render(
			<StructureTree
				floorPlans={[plan]}
				storeys={[storey]}
				units={[unit]}
				onAddFloorPlan={addPlan}
				onAddUnit={addUnit}
				onSelect={select}
			/>
		);
		expect(screen.getByText(/1 plan/)).toBeTruthy();
		fireEvent.click(
			screen.getByRole("button", { name: /Floor plan Ground plan/ })
		);
		expect(select).toHaveBeenCalledWith({ kind: "floor-plan", id: "p1" });
		fireEvent.click(
			screen.getByRole("button", { name: "Add floor plan to Ground floor" })
		);
		fireEvent.click(
			screen.getByRole("button", { name: "Add unit to Ground plan" })
		);
		expect(addPlan).toHaveBeenCalledWith("s1");
		expect(addUnit).toHaveBeenCalledWith("p1");
		fireEvent.click(
			screen.getByRole("button", { name: "Collapse Ground floor" })
		);
		expect(screen.queryByText(/1 unit/)).toBeNull();
	});
	it("derives storey height and counts", () => {
		render(<StoreyDetail floorPlans={[plan]} storey={storey} units={[unit]} />);
		expect(screen.getAllByText("4.2 m")).toHaveLength(2);
		expect(screen.getByText("Transfer slab")).toBeTruthy();
	});
	it("opens supplied children", () => {
		const open = vi.fn();
		const edit = vi.fn();
		const remove = vi.fn();
		const { rerender } = render(
			<FloorPlansTable
				drawings={[]}
				floorPlans={[plan]}
				units={[unit]}
				onDelete={remove}
				onEdit={edit}
				onOpen={open}
			/>
		);
		fireEvent.click(screen.getByRole("button", { name: "Open Ground plan" }));
		expect(open).toHaveBeenCalledWith("p1");
		fireEvent.click(screen.getByRole("button", { name: "Edit Ground plan" }));
		expect(edit).toHaveBeenCalledWith(plan);
		rerender(
			<UnitsTable
				installations={[]}
				units={[unit]}
				onDelete={remove}
				onEdit={edit}
				onOpen={open}
			/>
		);
		fireEvent.click(screen.getByRole("button", { name: "Open B-G-01" }));
		fireEvent.click(screen.getByRole("button", { name: "Delete B-G-01" }));
		expect(open).toHaveBeenCalledWith("u1");
		expect(remove).toHaveBeenCalledWith(unit);
	});
	it("renders structure vocabulary in Simplified Chinese", async () => {
		await i18n.changeLanguage("zh-CN");
		render(
			<StructureTree
				floorPlans={[]}
				storeys={[storey]}
				units={[]}
				onSelect={vi.fn()}
			/>
		);
		expect(screen.getByText("楼层")).toBeTruthy();
		expect(screen.getByRole("tree", { name: "建筑结构" })).toBeTruthy();
		await i18n.changeLanguage("en-US");
	});
});
