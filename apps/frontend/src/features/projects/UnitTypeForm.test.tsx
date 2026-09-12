import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { UnitTypeForm } from "@/features/projects/UnitTypeForm";
it("requires a code and submits an optional description with developer qualifiers", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	render(<UnitTypeForm onSubmit={onSubmit} />);
	await user.click(screen.getByRole("button", { name: "Add Unit Type" }));
	expect(screen.getByText("Enter a Unit Type code.")).toBeVisible();
	expect(onSubmit).not.toHaveBeenCalled();
	await user.type(screen.getByLabelText("Code"), "BP2(p) (M)");
	await user.click(screen.getByRole("button", { name: "Add Unit Type" }));
	expect(onSubmit).toHaveBeenCalledWith({
		code: "BP2(p) (M)",
		description: null,
	});
});
it("edits an existing description, can clear it, and reports a taken code on the field", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue({
		field: "code",
		message: "A Unit Type with this code already exists.",
	});
	render(
		<UnitTypeForm
			unitType={{
				id: "t1",
				code: "AS1",
				description: "1 Bedroom",
				unitCount: 2,
			}}
			onCancel={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	await user.clear(screen.getByLabelText("Description"));
	await user.click(screen.getByRole("button", { name: "Save Unit Type" }));
	expect(onSubmit).toHaveBeenCalledWith({ code: "AS1", description: null });
	expect(screen.getByLabelText("Code")).toHaveAttribute("aria-invalid", "true");
	expect(
		screen.getByText("A Unit Type with this code already exists.")
	).toBeVisible();
});
it("prevents repeated submission while busy and lets editing be cancelled", async () => {
	const user = userEvent.setup();
	const onCancel = vi.fn();
	const props = {
		unitType: { id: "t1", code: "AS1", description: null, unitCount: 0 },
		onCancel,
		onSubmit: vi.fn().mockResolvedValue(undefined),
	};
	const { rerender } = render(<UnitTypeForm {...props} pending />);
	expect(screen.getByLabelText("Code")).toBeDisabled();
	expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	rerender(<UnitTypeForm {...props} />);
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(onCancel).toHaveBeenCalledOnce();
});
it("validates maximum code and description lengths", async () => {
	const user = userEvent.setup();
	render(<UnitTypeForm onSubmit={vi.fn().mockResolvedValue(undefined)} />);
	await user.type(screen.getByLabelText("Code"), "a".repeat(41));
	await user.type(screen.getByLabelText("Description"), "d".repeat(121));
	await user.click(screen.getByRole("button", { name: "Add Unit Type" }));
	expect(screen.getByText("Use at most 40 characters.")).toBeVisible();
	expect(screen.getByText("Use at most 120 characters.")).toBeVisible();
});
