import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { UnitMatrixTable } from "@/features/projects/UnitMatrixTable";
it("shows Storeys and Stacks as table headers, preserving a merged Unit's empty cell", () => {
	render(
		<UnitMatrixTable
			block={{
				name: "West",
				stacks: ["01", "02"],
				storeys: [{ name: "01", cells: ["PH", null] }],
				unitCount: 1,
				warnings: [],
			}}
		/>
	);
	const table = screen.getByRole("table", { name: "Unit Matrix · West" });
	expect(within(table).getByRole("columnheader", { name: "02" })).toBeVisible();
	expect(within(table).getByRole("rowheader", { name: "01" })).toBeVisible();
	expect(within(table).getAllByRole("cell")).toHaveLength(2);
	expect(within(table).getAllByRole("cell")[1]).toBeEmptyDOMElement();
});
