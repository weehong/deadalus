import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DeleteSubcontractorDialog } from "./DeleteSubcontractorDialog";

it("names the Subcontractor and Member count and confirms through its callback", async () => {
	const onConfirm = vi.fn();
	render(
		<DeleteSubcontractorDialog
			open
			error={false}
			memberCount={2}
			name="Acme Fitout"
			pending={false}
			onCancel={vi.fn()}
			onConfirm={onConfirm}
		/>
	);
	expect(
		screen.getByRole("dialog", { name: "Delete subcontractor?" })
	).toHaveTextContent(
		"Delete Acme Fitout and its 2 Members? This cannot be undone."
	);
	await userEvent.click(
		screen.getByRole("button", { name: "Delete subcontractor" })
	);
	expect(onConfirm).toHaveBeenCalledOnce();
});

it("shows a retryable failure without losing the name and Member count", async () => {
	const onConfirm = vi.fn();
	render(
		<DeleteSubcontractorDialog
			error
			open
			memberCount={1}
			name="Acme Fitout"
			pending={false}
			onCancel={vi.fn()}
			onConfirm={onConfirm}
		/>
	);
	expect(screen.getByRole("dialog")).toHaveTextContent(
		"Delete Acme Fitout and its 1 Member? This cannot be undone."
	);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not delete the Subcontractor. Please try again."
	);
	await userEvent.click(
		screen.getByRole("button", { name: "Delete subcontractor" })
	);
	expect(onConfirm).toHaveBeenCalledOnce();
});

it("refuses repeated confirmation and dismissal while deletion is pending", async () => {
	const onConfirm = vi.fn();
	const onCancel = vi.fn();
	render(
		<DeleteSubcontractorDialog
			open
			pending
			error={false}
			memberCount={2}
			name="Acme Fitout"
			onCancel={onCancel}
			onConfirm={onConfirm}
		/>
	);
	const confirm = screen.getByRole("button", { name: "Delete subcontractor" });
	expect(confirm).toBeDisabled();
	expect(confirm).toHaveAttribute("aria-busy", "true");
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	await userEvent.click(confirm);
	await userEvent.keyboard("{Escape}");
	expect(onConfirm).not.toHaveBeenCalled();
	expect(onCancel).not.toHaveBeenCalled();
	expect(screen.getByRole("dialog")).toBeVisible();
});
