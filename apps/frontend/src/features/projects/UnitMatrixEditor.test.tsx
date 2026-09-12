import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { UnitMatrixEditor } from "@/features/projects/UnitMatrixEditor";
import type { UnitMatrixBlock } from "@/features/projects/unitMatrixTypes";
const original: UnitMatrixBlock = {
	name: "West",
	stacks: ["1", "2"],
	storeys: [{ name: "01", cells: ["A", null] }],
	unitCount: 1,
	warnings: [],
};
function Editor(): React.ReactElement {
	const [value, setValue] = useState(original);
	return <UnitMatrixEditor value={value} onChange={setValue} />;
}
it("edits and clears labelled cells and renames a Storey through its plain value", async () => {
	const user = userEvent.setup();
	render(<Editor />);
	expect(
		screen.getByRole("table", { name: "Unit Matrix · West" })
	).toBeVisible();
	await user.clear(screen.getByLabelText("Storey 01, Stack 1"));
	await user.type(screen.getByLabelText("Storey 01, Stack 2"), "BP2(p) (M)");
	await user.clear(screen.getByLabelText("Storey name, row 1"));
	await user.type(screen.getByLabelText("Storey name, row 1"), "Roof");
	expect(screen.getByLabelText("Storey Roof, Stack 1")).toHaveValue("");
	expect(screen.getByLabelText("Storey Roof, Stack 2")).toHaveValue(
		"BP2(p) (M)"
	);
});
it("inserts and removes aligned rows and columns with keyboard-operable controls", async () => {
	const user = userEvent.setup();
	render(<Editor />);
	const prompt = vi
		.spyOn(window, "prompt")
		.mockReturnValueOnce("02")
		.mockReturnValueOnce("3");
	screen.getByRole("button", { name: "Insert Storey below 01" }).focus();
	await user.keyboard("{Enter}");
	await user.click(
		screen.getByRole("button", { name: "Insert Stack right of 2" })
	);
	await user.type(screen.getByLabelText("Storey 02, Stack 3"), "PH");
	await user.click(screen.getByRole("button", { name: "Remove Stack 1" }));
	expect(screen.getByLabelText("Storey 02, Stack 3")).toHaveValue("PH");
	await user.click(screen.getByRole("button", { name: "Remove Storey 01" }));
	expect(screen.queryByLabelText("Storey 01, Stack 3")).not.toBeInTheDocument();
	prompt.mockRestore();
});
