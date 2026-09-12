import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ProgressEntryForm } from "./ProgressEntryForm";
const VALUE = "Progression (0 to 100)";
const NOTE = "Note (optional)";
const accepted = (): Promise<void> => Promise.resolve();
it("enters a whole number with a trimmed note, omits a blank note, and resets after success", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn(accepted);
	render(<ProgressEntryForm itemName="Sink" onSubmit={onSubmit} />);
	const form = screen.getByRole("form", { name: "Enter progress for Sink" });
	const value = within(form).getByLabelText(VALUE);
	expect(value).toHaveAttribute("type", "number");
	expect(value).toHaveAttribute("inputmode", "numeric");
	expect(value).toHaveAttribute("min", "0");
	expect(value).toHaveAttribute("max", "100");
	await user.type(value, "75");
	await user.type(within(form).getByLabelText(NOTE), "  Doors hung  ");
	await user.click(within(form).getByRole("button", { name: "Enter" }));
	await waitFor(() => {
		expect(onSubmit).toHaveBeenCalledWith({ value: 75, note: "Doors hung" });
	});
	await waitFor(() => {
		expect(value).toHaveValue(null);
	});
	expect(within(form).getByLabelText(NOTE)).toHaveValue("");
	// The controls are disabled until the submission settles; then a later
	// entry may be lower than the last, and a blank note does not travel.
	await waitFor(() => {
		expect(value).toBeEnabled();
	});
	// userEvent keeps its own value tracker, which a native form reset bypasses.
	await user.clear(value);
	await user.type(value, "30");
	await user.click(within(form).getByRole("button", { name: "Enter" }));
	await waitFor(() => {
		expect(onSubmit).toHaveBeenLastCalledWith({ value: 30 });
	});
	expect(onSubmit).toHaveBeenCalledTimes(2);
});
it("refuses a missing, fractional or out-of-range value and a long note without submitting", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn(accepted);
	render(<ProgressEntryForm itemName="Sink" onSubmit={onSubmit} />);
	const value = screen.getByLabelText(VALUE);
	const submit = screen.getByRole("button", { name: "Enter" });
	await user.click(submit);
	expect(
		await screen.findByText("Enter a whole number from 0 to 100.")
	).toBeVisible();
	expect(value).toHaveAttribute("aria-invalid", "true");
	expect(value).toHaveFocus();
	const refuse = async (typed: string): Promise<void> => {
		await user.clear(value);
		await user.type(value, typed);
		await user.click(submit);
		expect(
			await screen.findByText("Enter a whole number from 0 to 100.")
		).toBeVisible();
	};
	await refuse("150");
	await refuse("-1");
	await refuse("50.5");
	await user.clear(value);
	await user.type(value, "50");
	await user.type(screen.getByLabelText(NOTE), "x".repeat(201));
	await user.click(submit);
	expect(
		await screen.findByText("Keep the note to 200 characters.")
	).toBeVisible();
	expect(screen.getByLabelText(NOTE)).toHaveAttribute("aria-invalid", "true");
	expect(onSubmit).not.toHaveBeenCalled();
});
it("shows the API's refusal on the form and its field error on the field", async () => {
	const user = userEvent.setup();
	const onSubmit = vi
		.fn()
		.mockResolvedValueOnce({
			message: "This Item has no Assignment. Assign it first.",
		})
		.mockResolvedValueOnce({
			field: "note",
			message: "Keep the note to 200 characters.",
		});
	render(<ProgressEntryForm itemName="Sink" onSubmit={onSubmit} />);
	const value = screen.getByLabelText(VALUE);
	await user.type(value, "50");
	await user.click(screen.getByRole("button", { name: "Enter" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"This Item has no Assignment. Assign it first."
	);
	// The values stay for a retry.
	expect(value).toHaveValue(50);
	await user.click(screen.getByRole("button", { name: "Enter" }));
	expect(
		await screen.findByText("Keep the note to 200 characters.")
	).toBeVisible();
	expect(screen.getByLabelText(NOTE)).toHaveFocus();
	expect(screen.queryByRole("alert")).toBeNull();
});
it("puts the given classes on every control, so the Field can size them for a thumb", () => {
	render(
		<ProgressEntryForm
			controlClassName="h-[44px] text-base"
			itemName="Sink"
			onSubmit={vi.fn()}
		/>
	);
	expect(screen.getByLabelText(VALUE)).toHaveClass("h-[44px]", "text-base");
	expect(screen.getByLabelText(NOTE)).toHaveClass("h-[44px]");
	expect(screen.getByRole("button", { name: "Enter" })).toHaveClass("h-[44px]");
});
it("is disabled with a hint on an Item with no Assignment, and busy while pending", () => {
	const { rerender } = render(
		<ProgressEntryForm unassigned itemName="Wardrobe" onSubmit={vi.fn()} />
	);
	expect(
		screen.getByText(
			"Assign this Item to a Subcontractor before entering progress."
		)
	).toBeVisible();
	expect(screen.getByLabelText(VALUE)).toBeDisabled();
	expect(screen.getByLabelText(NOTE)).toBeDisabled();
	expect(screen.getByRole("button", { name: "Enter" })).toBeDisabled();
	rerender(
		<ProgressEntryForm pending itemName="Wardrobe" onSubmit={vi.fn()} />
	);
	expect(
		screen.queryByText(
			"Assign this Item to a Subcontractor before entering progress."
		)
	).toBeNull();
	const busy = screen.getByRole("button", { name: "Entering…" });
	expect(busy).toHaveAttribute("aria-busy", "true");
	expect(busy).toBeDisabled();
	expect(screen.getByLabelText(VALUE)).toBeDisabled();
});
