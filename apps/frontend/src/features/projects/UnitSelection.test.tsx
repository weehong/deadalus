import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { UnitSelection } from "@/features/projects/UnitSelection";
import type { Project } from "@/features/projects/types";
import { selectAll } from "@/features/projects/unit-selection";
const rollup = { itemCount: 0, entryCount: 0, progression: null };
const project: Project = {
	id: "gardens",
	name: "Gardens",
	code: "EG2",
	...rollup,
	blocks: [
		{
			id: "a",
			name: "A",
			position: 0,
			...rollup,
			storeys: [
				{ id: "a1", name: "01", position: 0, ...rollup, units: [] },
				{ id: "a2", name: "02", position: 1, ...rollup, units: [] },
			],
		},
		{
			id: "b",
			name: "B",
			position: 1,
			...rollup,
			storeys: [{ id: "b1", name: "01", position: 0, ...rollup, units: [] }],
		},
	],
	unitTypes: [
		{ id: "as1", code: "AS1", description: null, unitCount: 0 },
		{ id: "bp2", code: "BP2", description: null, unitCount: 0 },
	],
	catalogueItems: [],
};
it("offers every Block's Storeys named by Block, with select-all, and reports each change", async () => {
	const user = userEvent.setup();
	const onChange = vi.fn();
	render(
		<UnitSelection
			project={project}
			summary="Will add 5 Items; 0 Units already hold it."
			value={selectAll(project, null)}
			onChange={onChange}
		/>
	);
	expect(screen.getByLabelText("Block")).toHaveValue("");
	for (const name of ["A · 01", "A · 02", "B · 01", "AS1", "BP2"])
		expect(screen.getByRole("checkbox", { name })).toBeChecked();
	expect(screen.getByLabelText("Select all Storeys")).toBeChecked();
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will add 5 Items; 0 Units already hold it."
	);
	await user.click(screen.getByRole("checkbox", { name: "A · 02" }));
	expect(onChange).toHaveBeenLastCalledWith({
		blockId: null,
		storeyIds: ["a1", "b1"],
		unitTypeIds: ["as1", "bp2"],
	});
	await user.click(screen.getByLabelText("Select all Unit Types"));
	expect(onChange).toHaveBeenLastCalledWith({
		blockId: null,
		storeyIds: ["a1", "a2", "b1"],
		unitTypeIds: [],
	});
	await user.selectOptions(screen.getByLabelText("Block"), "b");
	expect(onChange).toHaveBeenLastCalledWith({
		blockId: "b",
		storeyIds: ["b1"],
		unitTypeIds: ["as1", "bp2"],
	});
});
it("lists only the chosen Block's Storeys by their own names and can be disabled", () => {
	render(
		<UnitSelection
			disabled
			project={project}
			summary="Busy"
			value={{ blockId: "a", storeyIds: ["a1"], unitTypeIds: [] }}
			onChange={vi.fn()}
		/>
	);
	expect(screen.getByLabelText("Block")).toHaveValue("a");
	expect(screen.getByRole("checkbox", { name: "01" })).toBeChecked();
	expect(screen.getByRole("checkbox", { name: "02" })).not.toBeChecked();
	expect(screen.queryByRole("checkbox", { name: "B · 01" })).toBeNull();
	expect(screen.getByLabelText("Select all Storeys")).not.toBeChecked();
	expect(screen.getByLabelText("Select all Unit Types")).not.toBeChecked();
	for (const checkbox of screen.getAllByRole("checkbox"))
		expect(checkbox).toBeDisabled();
	expect(screen.getByLabelText("Block")).toBeDisabled();
});
it("omits the Unit Type list when the Project has none", () => {
	const untyped = { ...project, unitTypes: [] };
	render(
		<UnitSelection
			project={untyped}
			summary=""
			value={selectAll(untyped, null)}
			onChange={vi.fn()}
		/>
	);
	expect(screen.queryByLabelText("Select all Unit Types")).toBeNull();
	expect(screen.getByLabelText("Select all Storeys")).toBeChecked();
});
