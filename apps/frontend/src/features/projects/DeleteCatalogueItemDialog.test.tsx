import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DeleteCatalogueItemDialog } from "@/features/projects/DeleteCatalogueItemDialog";
it("names the Catalogue Item and requires an explicit confirmation", async () => {
	const user = userEvent.setup();
	const onConfirm = vi.fn((): Promise<void> => Promise.resolve());
	const onCancel = vi.fn();
	render(
		<DeleteCatalogueItemDialog
			open
			name="Kitchen cabinet"
			onCancel={onCancel}
			onConfirm={onConfirm}
		/>
	);
	expect(
		screen.getByRole("dialog", { name: "Delete Catalogue Item" })
	).toBeVisible();
	expect(
		screen.getByText("Delete Kitchen cabinet from the Item Catalogue?")
	).toBeVisible();
	expect(onConfirm).not.toHaveBeenCalled();
	await user.click(screen.getByRole("button", { name: "Delete" }));
	expect(onConfirm).toHaveBeenCalledOnce();
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(onCancel).toHaveBeenCalledOnce();
});
it("is busy while the delete runs, and shows the failure with the dialog still open when it is rejected", async () => {
	const user = userEvent.setup();
	let settle: () => void = () => {};
	const onConfirm = vi
		.fn<() => Promise<void>>()
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					settle = resolve;
				})
		)
		.mockRejectedValueOnce(new Error("Boom"));
	render(
		<DeleteCatalogueItemDialog
			open
			name="Sink"
			onCancel={vi.fn()}
			onConfirm={onConfirm}
		/>
	);
	const remove = screen.getByRole("button", { name: "Delete" });
	await user.click(remove);
	expect(remove).toHaveAttribute("aria-busy", "true");
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	settle();
	await waitFor(() => {
		expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
	});
	await user.click(screen.getByRole("button", { name: "Delete" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Could not delete the Catalogue Item. Try again."
	);
	expect(screen.getByRole("dialog")).toBeVisible();
	expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
});
