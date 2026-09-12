import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { CatalogueItemForm } from "@/features/projects/CatalogueItemForm";
it("requires a name, submits it as typed and clears after adding", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	render(<CatalogueItemForm onSubmit={onSubmit} />);
	await user.click(screen.getByRole("button", { name: "Add Catalogue Item" }));
	expect(screen.getByText("Enter an Item name.")).toBeVisible();
	expect(onSubmit).not.toHaveBeenCalled();
	await user.type(screen.getByLabelText("Item"), " Kitchen cabinet ");
	await user.click(screen.getByRole("button", { name: "Add Catalogue Item" }));
	expect(onSubmit).toHaveBeenCalledWith({ name: "Kitchen cabinet" });
	expect(screen.getByLabelText("Item")).toHaveValue("");
});
it("renames an existing Catalogue Item and reports a taken name on the field", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue({
		field: "name",
		message: "A Catalogue Item with this name already exists in this Project.",
	});
	render(
		<CatalogueItemForm
			catalogueItem={{ id: "cabinet", name: "Kitchen cabinet", itemCount: 2 }}
			onCancel={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	expect(
		screen.getByRole("form", { name: "Rename Catalogue Item" })
	).toBeVisible();
	await user.clear(screen.getByLabelText("Item"));
	await user.type(screen.getByLabelText("Item"), "Wardrobe");
	await user.click(screen.getByRole("button", { name: "Save Catalogue Item" }));
	expect(onSubmit).toHaveBeenCalledWith({ name: "Wardrobe" });
	expect(screen.getByLabelText("Item")).toHaveAttribute("aria-invalid", "true");
	expect(screen.getByLabelText("Item")).toHaveValue("Wardrobe");
	expect(
		screen.getByText(
			"A Catalogue Item with this name already exists in this Project."
		)
	).toBeVisible();
});
it("shows a general failure above the fields", async () => {
	const user = userEvent.setup();
	render(
		<CatalogueItemForm
			onSubmit={vi.fn().mockResolvedValue({ message: "Could not save." })}
		/>
	);
	await user.type(screen.getByLabelText("Item"), "Sink");
	await user.click(screen.getByRole("button", { name: "Add Catalogue Item" }));
	expect(screen.getByRole("alert")).toHaveTextContent("Could not save.");
});
it("prevents repeated submission while busy and lets renaming be cancelled", async () => {
	const user = userEvent.setup();
	const onCancel = vi.fn();
	const props = {
		catalogueItem: { id: "cabinet", name: "Kitchen cabinet", itemCount: 0 },
		onCancel,
		onSubmit: vi.fn().mockResolvedValue(undefined),
	};
	const { rerender } = render(<CatalogueItemForm {...props} pending />);
	expect(screen.getByLabelText("Item")).toBeDisabled();
	expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	rerender(<CatalogueItemForm {...props} />);
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(onCancel).toHaveBeenCalledOnce();
});
it("validates the maximum name length", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	render(<CatalogueItemForm onSubmit={onSubmit} />);
	const input = screen.getByLabelText("Item");
	await user.click(input);
	await user.paste("a".repeat(61));
	await user.click(screen.getByRole("button", { name: "Add Catalogue Item" }));
	expect(screen.getByText("Use at most 60 characters.")).toBeVisible();
	expect(onSubmit).not.toHaveBeenCalled();
});
