import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { StructurePane } from "@/features/projects/StructurePane";
it("labels its list, marks the current row and selects another row", async () => {
	const onSelect = vi.fn();
	render(
		<StructurePane
			emptyMessage="Add a Block next."
			heading="Blocks"
			selectedId="a"
			rows={[
				{ id: "a", name: "A", detail: "2 storeys · 8 units" },
				{ id: "b", name: "B", detail: "0 storeys · 0 units" },
			]}
			onSelect={onSelect}
		/>
	);
	expect(screen.getByRole("list", { name: "Blocks" })).toBeVisible();
	expect(
		screen.getByRole("button", { name: "A 2 storeys · 8 units" })
	).toHaveAttribute("aria-current", "true");
	await userEvent.click(
		screen.getByRole("button", { name: "B 0 storeys · 0 units" })
	);
	expect(onSelect).toHaveBeenCalledWith("b");
});
it("explains what to add when empty", () => {
	render(
		<StructurePane
			emptyMessage="Add a Block next."
			heading="Blocks"
			rows={[]}
			onSelect={(): void => {}}
		/>
	);
	expect(screen.getByText("Add a Block next.")).toBeVisible();
});
