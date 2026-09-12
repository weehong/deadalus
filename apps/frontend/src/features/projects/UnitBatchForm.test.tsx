import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { UnitBatchForm } from "@/features/projects/UnitBatchForm";
const storeys = [
	{ id: "s1", name: "01", position: 0, units: [] },
	{
		id: "s2",
		name: "02",
		position: 1,
		units: [{ id: "u", name: "A", position: 0, unitTypeId: null }],
	},
	{ id: "s3", name: "03", position: 2, units: [] },
];
const types = [{ id: "t", code: "AS1", description: null, unitCount: 0 }];
it("preselects the current Storey and marks clashes in any selected Storey", async () => {
	const user = userEvent.setup();
	const submit = vi.fn();
	render(
		<UnitBatchForm
			selectedStoreyId="s1"
			storeys={storeys}
			unitTypes={types}
			onCancel={vi.fn()}
			onSubmit={submit}
		/>
	);
	expect(screen.getByRole("checkbox", { name: "01" })).toBeChecked();
	await user.click(screen.getByRole("radio", { name: "List" }));
	await user.type(screen.getByLabelText("Names, one per line"), "A\nB");
	await user.click(screen.getByLabelText("Select all Storeys"));
	expect(screen.getByText(/6 units across 3 storeys/)).toBeVisible();
	expect(screen.getByText("Already exists")).toBeVisible();
	expect(screen.getByRole("button", { name: "Add names" })).toBeDisabled();
	await user.click(screen.getByRole("checkbox", { name: "02" }));
	await user.selectOptions(screen.getByLabelText("Unit Type"), "t");
	await user.click(screen.getByRole("button", { name: "Add names" }));
	expect(submit).toHaveBeenCalledWith({
		storeyIds: ["s1", "s3"],
		names: ["A", "B"],
		unitTypeId: "t",
	});
});
it("refuses no selected Storeys and the multiplied product beyond 2000", async () => {
	const user = userEvent.setup();
	render(
		<UnitBatchForm
			selectedStoreyId="s1"
			unitTypes={[]}
			storeys={Array.from({ length: 5 }, (_, index) => ({
				id: `s${index + 1}`,
				name: String(index + 1),
				position: index,
				units: [],
			}))}
			onCancel={vi.fn()}
			onSubmit={vi.fn()}
		/>
	);
	await user.click(screen.getByLabelText("Select all Storeys"));
	await user.clear(screen.getByLabelText("To", { exact: true }));
	await user.type(screen.getByLabelText("To", { exact: true }), "401");
	expect(screen.getByText(/2005 units across 5 storeys/)).toBeVisible();
	expect(screen.getByRole("button", { name: "Add names" })).toBeDisabled();
	await user.click(screen.getByLabelText("Select all Storeys"));
	expect(screen.getByText("Select 1 to 200 Storeys.")).toBeVisible();
	expect(screen.getByRole("button", { name: "Add names" })).toBeDisabled();
});
