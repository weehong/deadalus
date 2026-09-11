import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { MemberRowForm } from "./MemberRowForm";

it("requires both fields and submits trimmed values without normalizing the phone", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	render(<MemberRowForm onCancel={vi.fn()} onSubmit={onSubmit} />);
	await user.click(screen.getByRole("button", { name: "Add Member" }));
	expect(screen.getByLabelText("Member name")).toHaveAccessibleDescription(
		"Member name is required"
	);
	expect(screen.getByLabelText("Phone number")).toHaveAccessibleDescription(
		"Phone number is required"
	);
	expect(onSubmit).not.toHaveBeenCalled();
	await user.type(screen.getByLabelText("Member name"), " Mei ");
	await user.type(screen.getByLabelText("Phone number"), " 9234 5678 {Enter}");
	expect(onSubmit).toHaveBeenCalledWith({ name: "Mei", phone: "9234 5678" });
});
it("prepopulates edits and focuses a returned phone conflict while retaining input", async () => {
	const user = userEvent.setup();
	render(
		<MemberRowForm
			member={{ name: "Alex", phone: "+6591234567" }}
			onCancel={vi.fn()}
			onSubmit={vi.fn().mockResolvedValue({
				field: "phone",
				message: "This phone belongs to Beacon.",
			})}
		/>
	);
	expect(screen.getByLabelText("Member name")).toHaveValue("Alex");
	await user.click(screen.getByRole("button", { name: "Save Member" }));
	expect(screen.getByLabelText("Phone number")).toHaveAccessibleDescription(
		"This phone belongs to Beacon."
	);
	expect(screen.getByLabelText("Phone number")).toHaveFocus();
	expect(screen.getByLabelText("Member name")).toHaveValue("Alex");
});
it("rejects impossible phones and announces general failures without losing input", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue({ message: "Please retry." });
	render(
		<MemberRowForm
			member={{ name: "Alex", phone: "123" }}
			onCancel={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Save Member" }));
	expect(screen.getByLabelText("Phone number")).toHaveAccessibleDescription(
		"Enter a valid phone number"
	);
	expect(onSubmit).not.toHaveBeenCalled();
	await user.clear(screen.getByLabelText("Phone number"));
	await user.type(screen.getByLabelText("Phone number"), "9123 4567");
	await user.click(screen.getByRole("button", { name: "Save Member" }));
	expect(await screen.findByRole("alert")).toHaveTextContent("Please retry.");
	expect(screen.getByLabelText("Phone number")).toHaveValue("9123 4567");
});
it("prevents repeat submits while saving and cancels when idle", async () => {
	const user = userEvent.setup();
	const onCancel = vi.fn();
	const { rerender } = render(
		<MemberRowForm pending onCancel={onCancel} onSubmit={vi.fn()} />
	);
	expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Saving…" })).toHaveAttribute(
		"aria-busy",
		"true"
	);
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	rerender(<MemberRowForm onCancel={onCancel} onSubmit={vi.fn()} />);
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(onCancel).toHaveBeenCalledOnce();
});
