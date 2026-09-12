import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { DeleteProjectDialog } from "@/features/projects/DeleteProjectDialog";

it("names the Project and descendant counts and confirms through its callback", async () => {
	const onConfirm = vi.fn();
	render(
		<DeleteProjectDialog
			open
			blockCount={2}
			error={false}
			name="Acme Fitout"
			pending={false}
			storeyCount={3}
			unitCount={4}
			onCancel={vi.fn()}
			onConfirm={onConfirm}
		/>
	);
	expect(
		screen.getByRole("dialog", { name: "Delete project?" })
	).toHaveTextContent(
		"Delete Acme Fitout and its 2 Blocks, 3 Storeys and 4 Units? All Unit Types will also be removed. This cannot be undone."
	);
	await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
	expect(onConfirm).toHaveBeenCalledOnce();
});

it("shows a retryable failure without losing the name and descendant counts", async () => {
	const onConfirm = vi.fn();
	render(
		<DeleteProjectDialog
			error
			open
			blockCount={1}
			name="Acme Fitout"
			pending={false}
			storeyCount={2}
			unitCount={3}
			onCancel={vi.fn()}
			onConfirm={onConfirm}
		/>
	);
	expect(screen.getByRole("dialog")).toHaveTextContent(
		"Delete Acme Fitout and its 1 Blocks, 2 Storeys and 3 Units? All Unit Types will also be removed. This cannot be undone."
	);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not delete the project. Please try again."
	);
	await userEvent.click(screen.getByRole("button", { name: "Delete project" }));
	expect(onConfirm).toHaveBeenCalledOnce();
});

it("refuses repeated confirmation and dismissal while deletion is pending", async () => {
	const onConfirm = vi.fn();
	const onCancel = vi.fn();
	render(
		<DeleteProjectDialog
			open
			pending
			blockCount={2}
			error={false}
			name="Acme Fitout"
			storeyCount={3}
			unitCount={4}
			onCancel={onCancel}
			onConfirm={onConfirm}
		/>
	);
	const confirm = screen.getByRole("button", { name: "Delete project" });
	expect(confirm).toBeDisabled();
	expect(confirm).toHaveAttribute("aria-busy", "true");
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	await userEvent.click(confirm);
	await userEvent.keyboard("{Escape}");
	expect(onConfirm).not.toHaveBeenCalled();
	expect(onCancel).not.toHaveBeenCalled();
	expect(screen.getByRole("dialog")).toBeVisible();
});
