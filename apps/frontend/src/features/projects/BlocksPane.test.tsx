import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { BlocksPane } from "@/features/projects/BlocksPane";
const blocks = [
	{
		id: "a",
		name: "A",
		position: 0,
		storeys: [
			{
				id: "s",
				name: "01",
				position: 0,
				units: [{ id: "u", name: "01", position: 0, unitTypeId: null }],
			},
		],
	},
];
it("adds a single Block and clears the field", async () => {
	const user = userEvent.setup();
	const add = vi.fn().mockResolvedValue(undefined);
	render(
		<BlocksPane
			blocks={[]}
			onAdd={add}
			onDelete={vi.fn()}
			onRename={vi.fn()}
			onSelect={vi.fn()}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Add Block" }));
	await user.type(screen.getByLabelText("Block name"), " B ");
	await user.keyboard("{Enter}");
	expect(add).toHaveBeenCalledWith(["B"]);
	expect(screen.getByLabelText("Block name")).toHaveValue("");
});
it("renames inline and confirms deletion with descendant counts and focus", async () => {
	const user = userEvent.setup();
	const rename = vi.fn().mockResolvedValue(undefined);
	const remove = vi.fn().mockResolvedValue(undefined);
	render(
		<BlocksPane
			blocks={blocks}
			onAdd={vi.fn()}
			onDelete={remove}
			onRename={rename}
			onSelect={vi.fn()}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Rename" }));
	await user.clear(screen.getByLabelText("Block name"));
	await user.type(screen.getByLabelText("Block name"), "Z");
	await user.keyboard("{Enter}");
	expect(rename).toHaveBeenCalledWith("a", "Z");
	await user.click(screen.getByRole("button", { name: "Delete" }));
	const dialog = screen.getByRole("dialog");
	expect(dialog).toHaveTextContent(
		"Delete Block A and its 1 storeys and 1 units?"
	);
	expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
	await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
	expect(remove).not.toHaveBeenCalled();
	expect(
		screen.getByRole("button", { name: "Delete" })
	).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Delete" }));
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Delete",
		})
	);
	expect(remove).toHaveBeenCalledWith("a");
});
