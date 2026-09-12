import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DeleteUnitTypeDialog } from "@/features/projects/DeleteUnitTypeDialog";
it("names the Unit Type and requires an explicit confirmation", async () => {
	const user = userEvent.setup();
	const onConfirm = vi.fn();
	const onCancel = vi.fn();
	render(
		<DeleteUnitTypeDialog
			open
			code="BP2(p)"
			pending={false}
			onCancel={onCancel}
			onConfirm={onConfirm}
		/>
	);
	expect(
		screen.getByRole("dialog", { name: "Delete Unit Type" })
	).toBeVisible();
	expect(screen.getByText("Delete Unit Type BP2(p)?")).toBeVisible();
	expect(onConfirm).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Delete" }));
	expect(onConfirm).toHaveBeenCalledOnce();
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(onCancel).toHaveBeenCalledOnce();
});
