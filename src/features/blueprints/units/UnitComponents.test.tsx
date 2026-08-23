/* eslint-disable camelcase -- fixtures mirror provider rows */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/common/i18n";
import type { Installation, Unit } from "../data/database";
import {
	InstallationsTable,
	SheetReference,
	UnitDetailCard,
} from "./UnitComponents";

const base = { created_at: "", updated_at: "" };
const unit: Unit = {
	...base,
	id: "u1",
	site_id: "s1",
	floor_plan_id: "p1",
	code: "01-01",
	room_tags: ["101", "102"],
	usable_area: 80,
	ceiling_height: 2.8,
	entry_door: "D1",
	boundary_note: null,
	boundary_type: "demising wall",
	grid_reference: "A1",
	status: "occupied",
};
const installation: Installation = {
	...base,
	id: "i1",
	site_id: "s1",
	unit_id: "u1",
	equipment: "AHU",
	model: "X2",
	asset_tag: "M-1",
	location_in_unit: "Plant room",
	installed_date: "2026-01-01",
	state: "live",
};

describe("unit components", () => {
	it("renders all unit detail fields", () => {
		render(<UnitDetailCard unit={unit} onEdit={vi.fn()} />);
		expect(screen.getByText("01-01")).toBeTruthy();
		expect(screen.getByText("2.8")).toBeTruthy();
		expect(screen.getByText("occupied")).toBeTruthy();
	});
	it("renders installation summary and rows", () => {
		render(
			<InstallationsTable
				installations={[installation]}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		expect(screen.getByText("1 installed · 0 scheduled")).toBeTruthy();
		expect(screen.getByText("M-1")).toBeTruthy();
	});
	it("renders the unlinked sheet state", () => {
		render(<SheetReference onOpen={vi.fn()} />);
		expect(screen.getByText("No drawing linked")).toBeTruthy();
	});
});
