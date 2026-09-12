import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { StoreysPane } from "@/features/projects/StoreysPane";
const blocks = [
	{
		id: "a",
		name: "A",
		position: 0,
		itemCount: 0,
		entryCount: 0,
		progression: null,
		storeys: [
			{
				id: "s",
				name: "01",
				position: 0,
				itemCount: 4,
				entryCount: 1,
				progression: 25,
				units: [
					{
						id: "u",
						name: "01",
						position: 0,
						itemCount: 0,
						entryCount: 0,
						progression: null,
						unitTypeId: null,
						items: [],
					},
				],
			},
		],
	},
];
it("adds a single Storey and clears the field", async () => {
	const user = userEvent.setup();
	const add = vi.fn().mockResolvedValue(undefined);
	render(
		<StoreysPane
			block={{
				id: "b",
				name: "A",
				position: 0,
				itemCount: 0,
				entryCount: 0,
				progression: null,
				storeys: [],
			}}
			onAdd={add}
			onDelete={vi.fn()}
			onRename={vi.fn()}
			onSelect={vi.fn()}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Add Storey" }));
	await user.type(screen.getByLabelText("Storey name"), " B ");
	await user.keyboard("{Enter}");
	expect(add).toHaveBeenCalledWith(["B"]);
	expect(screen.getByLabelText("Storey name")).toHaveValue("");
});
it("renames inline and confirms deletion with descendant counts and focus", async () => {
	const user = userEvent.setup();
	const rename = vi.fn().mockResolvedValue(undefined);
	const remove = vi.fn().mockResolvedValue(undefined);
	render(
		<StoreysPane
			block={blocks[0]}
			onAdd={vi.fn()}
			onDelete={remove}
			onRename={rename}
			onSelect={vi.fn()}
		/>
	);
	expect(screen.getByRole("button", { name: "01 1 units 25%" })).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Rename" }));
	await user.clear(screen.getByLabelText("Storey name"));
	await user.type(screen.getByLabelText("Storey name"), "Z");
	await user.keyboard("{Enter}");
	expect(rename).toHaveBeenCalledWith("s", "Z");
	await user.click(screen.getByRole("button", { name: "Delete" }));
	const dialog = screen.getByRole("dialog");
	expect(dialog).toHaveTextContent(
		"Delete Storey 01 and its 1 Units, 4 Items and 1 Progress entries?"
	);
	expect(within(dialog).getByRole("button", { name: "Cancel" })).toHaveFocus();
	await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
	expect(remove).not.toHaveBeenCalled();
	expect(screen.getByRole("button", { name: "Delete" })).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Delete" }));
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Delete",
		})
	);
	expect(remove).toHaveBeenCalledWith("s");
});
it("marks existing and repeated Storey names in the selected Block's batch", async () => {
	const user = userEvent.setup();
	render(
		<StoreysPane
			block={blocks[0]}
			onAdd={vi.fn()}
			onDelete={vi.fn()}
			onRename={vi.fn()}
			onSelect={vi.fn()}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Add many" }));
	await user.click(screen.getByRole("radio", { name: "List" }));
	await user.type(screen.getByLabelText("Names, one per line"), "01\n02\n02");
	expect(screen.getByText("Already exists")).toBeVisible();
	expect(screen.getAllByText("Repeated")).toHaveLength(2);
	expect(screen.getByRole("button", { name: "Add names" })).toBeDisabled();
});
it("does not offer Storey creation until a Block is selected", () => {
	render(
		<StoreysPane
			onAdd={vi.fn()}
			onDelete={vi.fn()}
			onRename={vi.fn()}
			onSelect={vi.fn()}
		/>
	);
	expect(
		screen.queryByRole("button", { name: "Add Storey" })
	).not.toBeInTheDocument();
});
it("offers Storey add, rename and delete in Chinese", async () => {
	const { default: i18n } = await import("@/common/i18n");
	await i18n.changeLanguage("zh-CN");
	try {
		const user = userEvent.setup();
		const add = vi.fn().mockResolvedValue(undefined);
		render(
			<StoreysPane
				block={blocks[0]}
				onAdd={add}
				onDelete={vi.fn()}
				onRename={vi.fn()}
				onSelect={vi.fn()}
			/>
		);
		expect(screen.getByRole("button", { name: "重命名" })).toBeVisible();
		expect(screen.getByRole("button", { name: "删除" })).toBeVisible();
		await user.click(screen.getByRole("button", { name: "添加楼层" }));
		await user.type(screen.getByLabelText("楼层名称"), "02");
		await user.keyboard("{Enter}");
		expect(add).toHaveBeenCalledWith(["02"]);
	} finally {
		await i18n.changeLanguage("en-US");
	}
});
