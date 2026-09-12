import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { UnitsPane } from "@/features/projects/UnitsPane";
const storey = {
	id: "s",
	name: "01",
	position: 0,
	itemCount: 0,
	entryCount: 0,
	progression: null,
	units: [
		{
			id: "u",
			name: "A",
			position: 0,
			itemCount: 2,
			entryCount: 3,
			progression: 40,
			unitTypeId: "t",
			items: [],
		},
	],
};
const block = {
	id: "b",
	name: "B",
	position: 0,
	itemCount: 0,
	entryCount: 0,
	progression: null,
	storeys: [storey],
};
const types = [{ id: "t", code: "AS1", description: null, unitCount: 1 }];
it("edits name and clears the type inline, returning focus to Edit", async () => {
	const user = userEvent.setup();
	const edit = vi.fn().mockResolvedValue(undefined);
	render(
		<UnitsPane
			block={block}
			storey={storey}
			unitTypes={types}
			onAdd={vi.fn()}
			onDelete={vi.fn()}
			onEdit={edit}
		/>
	);
	expect(screen.getByText("AS1")).toBeVisible();
	expect(screen.getByText("40%")).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Edit" }));
	expect(screen.getByLabelText("Unit name")).toHaveFocus();
	await user.clear(screen.getByLabelText("Unit name"));
	await user.type(screen.getByLabelText("Unit name"), "New");
	await user.selectOptions(screen.getByLabelText("Unit Type"), "");
	await user.click(screen.getByRole("button", { name: "Save" }));
	expect(edit).toHaveBeenCalledWith("u", { name: "New", unitTypeId: null });
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Edit" })).toHaveFocus()
	);
});
it("cancels deletion back to its trigger and confirms deletion with a safe focus target", async () => {
	const user = userEvent.setup();
	const remove = vi.fn().mockResolvedValue(undefined);
	render(
		<UnitsPane
			block={block}
			storey={storey}
			unitTypes={types}
			onAdd={vi.fn()}
			onDelete={remove}
			onEdit={vi.fn()}
		/>
	);
	const trigger = screen.getByRole("button", { name: "Delete" });
	await user.click(trigger);
	expect(screen.getByRole("dialog")).toHaveTextContent(
		"Delete Unit A and its 2 Items and 3 Progress entries?"
	);
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" })
	);
	await waitFor(() => expect(trigger).toHaveFocus());
	await user.click(trigger);
	await user.click(
		within(screen.getByRole("dialog")).getByRole("button", {
			name: "Delete",
		})
	);
	expect(remove).toHaveBeenCalledWith("u");
	await waitFor(() =>
		expect(screen.getByRole("button", { name: "Add" })).toHaveFocus()
	);
});
it("adds a single Unit to only the current Storey", async () => {
	const user = userEvent.setup();
	const add = vi.fn().mockResolvedValue(undefined);
	render(
		<UnitsPane
			block={block}
			storey={storey}
			unitTypes={types}
			onAdd={add}
			onDelete={vi.fn()}
			onEdit={vi.fn()}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Add" }));
	await user.type(screen.getByLabelText("Unit name"), "B");
	await user.selectOptions(screen.getByLabelText("Unit Type"), "t");
	await user.click(screen.getAllByRole("button", { name: "Add" })[1]!);
	expect(add).toHaveBeenCalledWith({
		names: ["B"],
		storeyIds: ["s"],
		unitTypeId: "t",
	});
});
it("renders Unit editing and deletion in Chinese", async () => {
	const { default: i18n } = await import("@/common/i18n");
	await i18n.changeLanguage("zh-CN");
	try {
		const user = userEvent.setup();
		render(
			<UnitsPane
				block={block}
				storey={storey}
				unitTypes={types}
				onAdd={vi.fn()}
				onDelete={vi.fn()}
				onEdit={vi.fn()}
			/>
		);
		await user.click(screen.getByRole("button", { name: "编辑" }));
		expect(screen.getByLabelText("单元名称")).toBeVisible();
		expect(screen.getByLabelText("单元类型")).toBeVisible();
	} finally {
		await i18n.changeLanguage("en-US");
	}
});
