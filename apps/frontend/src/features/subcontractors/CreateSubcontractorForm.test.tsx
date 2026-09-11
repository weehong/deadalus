import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CreateSubcontractorForm } from "./CreateSubcontractorForm";

describe("CreateSubcontractorForm", () => {
	it("associates all required errors with their fields before submission", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<CreateSubcontractorForm onCancel={vi.fn()} onSubmit={onSubmit} />);
		await user.click(
			screen.getByRole("button", { name: "Create subcontractor" })
		);
		expect(
			await screen.findByLabelText("Subcontractor name")
		).toHaveAccessibleDescription("Subcontractor name is required");
		expect(screen.getByLabelText("Member name")).toHaveAccessibleDescription(
			"Member name is required"
		);
		expect(screen.getByLabelText("Phone number")).toHaveAccessibleDescription(
			"Phone number is required"
		);
		expect(onSubmit).not.toHaveBeenCalled();
	});
});

it("rejects an impossible phone before submitting", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn();
	render(<CreateSubcontractorForm onCancel={vi.fn()} onSubmit={onSubmit} />);
	await user.type(screen.getByLabelText("Subcontractor name"), "Acme");
	await user.type(screen.getByLabelText("Member name"), "Alex");
	await user.type(screen.getByLabelText("Phone number"), "123");
	await user.click(
		screen.getByRole("button", { name: "Create subcontractor" })
	);
	expect(
		await screen.findByText("Enter a valid phone number")
	).toBeInTheDocument();
	expect(onSubmit).not.toHaveBeenCalled();
});
it("submits trimmed values with the phone as typed, including Enter", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	render(<CreateSubcontractorForm onCancel={vi.fn()} onSubmit={onSubmit} />);
	await user.type(screen.getByLabelText("Subcontractor name"), " Acme Fitout ");
	await user.type(screen.getByLabelText("Member name"), " Alex Tan ");
	await user.type(screen.getByLabelText("Phone number"), " 9123 4567 {Enter}");
	expect(onSubmit).toHaveBeenCalledWith({
		name: "Acme Fitout",
		member: { name: "Alex Tan", phone: "9123 4567" },
	});
});
it("announces a server failure and retains inputs", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue({ message: "Please try again." });
	render(<CreateSubcontractorForm onCancel={vi.fn()} onSubmit={onSubmit} />);
	await user.type(screen.getByLabelText("Subcontractor name"), "Acme");
	await user.type(screen.getByLabelText("Member name"), "Alex");
	await user.type(screen.getByLabelText("Phone number"), "9123 4567");
	await user.click(
		screen.getByRole("button", { name: "Create subcontractor" })
	);
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Please try again."
	);
	expect(screen.getByLabelText("Subcontractor name")).toHaveValue("Acme");
	expect(screen.getByLabelText("Member name")).toHaveValue("Alex");
	expect(screen.getByLabelText("Phone number")).toHaveValue("9123 4567");
});
it("associates and focuses a returned phone conflict", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue({
		field: "member.phone",
		message: "This phone belongs to Acme Fitout.",
	});
	render(<CreateSubcontractorForm onCancel={vi.fn()} onSubmit={onSubmit} />);
	await user.type(screen.getByLabelText("Subcontractor name"), "Beacon");
	await user.type(screen.getByLabelText("Member name"), "Mei");
	await user.type(screen.getByLabelText("Phone number"), "9123 4567");
	await user.click(
		screen.getByRole("button", { name: "Create subcontractor" })
	);
	expect(
		await screen.findByText("This phone belongs to Acme Fitout.")
	).toBeInTheDocument();
	expect(screen.getByLabelText("Phone number")).toHaveAccessibleDescription(
		"This phone belongs to Acme Fitout."
	);
	expect(screen.getByLabelText("Phone number")).toHaveFocus();
});
it("prevents further submission while busy and supports Cancel when idle", async () => {
	const user = userEvent.setup();
	const onCancel = vi.fn();
	const { rerender } = render(
		<CreateSubcontractorForm pending onCancel={onCancel} onSubmit={vi.fn()} />
	);
	expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Creating…" })).toHaveAttribute(
		"aria-busy",
		"true"
	);
	rerender(<CreateSubcontractorForm onCancel={onCancel} onSubmit={vi.fn()} />);
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(onCancel).toHaveBeenCalledOnce();
});
