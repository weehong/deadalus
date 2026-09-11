import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { RenameSubcontractorForm } from "./RenameSubcontractorForm";
it("submits the trimmed name with Enter", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	render(
		<RenameSubcontractorForm
			name="Acme"
			onCancel={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	await user.clear(screen.getByLabelText("Subcontractor name"));
	await user.type(
		screen.getByLabelText("Subcontractor name"),
		" Zenith Fitout {Enter}"
	);
	expect(onSubmit).toHaveBeenCalledWith({ name: "Zenith Fitout" });
});
it("associates a blank name error with the input before submission", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn();
	render(
		<RenameSubcontractorForm
			name="Acme"
			onCancel={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	await user.clear(screen.getByLabelText("Subcontractor name"));
	await user.click(screen.getByRole("button", { name: "Save name" }));
	expect(
		screen.getByLabelText("Subcontractor name")
	).toHaveAccessibleDescription("Subcontractor name is required");
	expect(onSubmit).not.toHaveBeenCalled();
});
it("focuses the name field for a taken-name error and retains input", async () => {
	const user = userEvent.setup();
	render(
		<RenameSubcontractorForm
			name="Acme"
			onCancel={vi.fn()}
			onSubmit={vi
				.fn()
				.mockResolvedValue({ field: "name", message: "This name is taken." })}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Save name" }));
	expect(
		screen.getByLabelText("Subcontractor name")
	).toHaveAccessibleDescription("This name is taken.");
	expect(screen.getByLabelText("Subcontractor name")).toHaveFocus();
	expect(screen.getByLabelText("Subcontractor name")).toHaveValue("Acme");
});
it("disables Save and Cancel while busy, then allows Cancel", async () => {
	const user = userEvent.setup();
	const onCancel = vi.fn();
	const { rerender } = render(
		<RenameSubcontractorForm
			pending
			name="Acme"
			onCancel={onCancel}
			onSubmit={vi.fn()}
		/>
	);
	expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Saving…" })).toHaveAttribute(
		"aria-busy",
		"true"
	);
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	rerender(
		<RenameSubcontractorForm
			name="Acme"
			onCancel={onCancel}
			onSubmit={vi.fn()}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(onCancel).toHaveBeenCalledOnce();
});
it("announces server failures and keeps the entered name", async () => {
	const user = userEvent.setup();
	render(
		<RenameSubcontractorForm
			name="Acme"
			onCancel={vi.fn()}
			onSubmit={vi.fn().mockResolvedValue({ message: "Please try again." })}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Save name" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Please try again."
	);
	expect(screen.getByLabelText("Subcontractor name")).toHaveValue("Acme");
});
