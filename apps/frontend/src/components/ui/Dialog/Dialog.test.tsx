import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { Dialog } from "./Dialog";

const Example = (): React.ReactElement => {
	const [open, setOpen] = useState(false);
	return (
		<>
			<button
				onClick={(): void => {
					setOpen(true);
				}}
			>
				Open confirmation
			</button>
			<Dialog
				open={open}
				title="Delete Subcontractor?"
				onClose={(): void => {
					setOpen(false);
				}}
			>
				<button
					data-autofocus
					onClick={(): void => {
						setOpen(false);
					}}
				>
					Cancel
				</button>
				<button>Confirm</button>
			</Dialog>
		</>
	);
};
it("labels the dialog, traps focus, dismisses with Escape and restores trigger focus", async () => {
	const user = userEvent.setup();
	render(<Example />);
	const trigger = screen.getByRole("button", { name: "Open confirmation" });
	await user.click(trigger);
	expect(
		screen.getByRole("dialog", { name: "Delete Subcontractor?" })
	).toBeVisible();
	const cancel = screen.getByRole("button", { name: "Cancel" });
	await waitFor(() => expect(cancel).toHaveFocus());
	await user.tab({ shift: true });
	expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();
	await user.tab();
	expect(cancel).toHaveFocus();
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
	);
	await waitFor(() => expect(trigger).toHaveFocus());
});
