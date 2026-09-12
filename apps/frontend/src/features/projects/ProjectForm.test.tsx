import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ProjectForm } from "@/features/projects/ProjectForm";

it("associates required errors with both fields before submission", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn();
	render(<ProjectForm onCancel={vi.fn()} onSubmit={onSubmit} />);
	await user.click(screen.getByRole("button", { name: "Create project" }));
	expect(screen.getByLabelText("Project name")).toHaveAccessibleDescription(
		"Project name is required"
	);
	expect(screen.getByLabelText("Project code")).toHaveAccessibleDescription(
		"Project code is required"
	);
	expect(onSubmit).not.toHaveBeenCalled();
});
it("upper-cases the code live and submits trimmed values via Enter", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	render(<ProjectForm onCancel={vi.fn()} onSubmit={onSubmit} />);
	await user.type(screen.getByLabelText("Project name"), " Emerald Gardens ");
	await user.type(screen.getByLabelText("Project code"), " eg-2 ");
	expect(screen.getByLabelText("Project code")).toHaveValue(" EG-2 ");
	await user.keyboard("{Enter}");
	expect(onSubmit).toHaveBeenCalledWith({
		name: "Emerald Gardens",
		code: "EG-2",
	});
});
it.each(["A", "ABCDEFGHIJKLM", "EG_2", "EG 2"])(
	"rejects invalid code %s before submitting",
	async (code) => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<ProjectForm onCancel={vi.fn()} onSubmit={onSubmit} />);
		await user.type(screen.getByLabelText("Project name"), "Emerald");
		await user.type(screen.getByLabelText("Project code"), code);
		await user.click(screen.getByRole("button", { name: "Create project" }));
		expect(screen.getByLabelText("Project code")).toHaveAccessibleDescription(
			"Use 2 to 12 letters, digits or hyphens"
		);
		expect(onSubmit).not.toHaveBeenCalled();
	}
);
it.each(["name", "code"] as const)(
	"associates and focuses server conflict on %s",
	async (field) => {
		const user = userEvent.setup();
		render(
			<ProjectForm
				onCancel={vi.fn()}
				onSubmit={vi
					.fn()
					.mockResolvedValue({ field, message: "Already taken" })}
			/>
		);
		await user.type(screen.getByLabelText("Project name"), "Emerald");
		await user.type(screen.getByLabelText("Project code"), "EG2");
		await user.click(screen.getByRole("button", { name: "Create project" }));
		const input = screen.getByLabelText(
			field === "name" ? "Project name" : "Project code"
		);
		expect(input).toHaveAccessibleDescription("Already taken");
		expect(input).toHaveFocus();
	}
);
it("announces server failure and retains both fields", async () => {
	const user = userEvent.setup();
	render(
		<ProjectForm
			onCancel={vi.fn()}
			onSubmit={vi.fn().mockResolvedValue({ message: "Please try again." })}
		/>
	);
	await user.type(screen.getByLabelText("Project name"), "Emerald");
	await user.type(screen.getByLabelText("Project code"), "eg2");
	await user.click(screen.getByRole("button", { name: "Create project" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Please try again."
	);
	expect(screen.getByLabelText("Project name")).toHaveValue("Emerald");
	expect(screen.getByLabelText("Project code")).toHaveValue("EG2");
});
it("disables submission and Cancel while busy, and supports Cancel while idle", async () => {
	const user = userEvent.setup();
	const onCancel = vi.fn();
	const { rerender } = render(
		<ProjectForm pending onCancel={onCancel} onSubmit={vi.fn()} />
	);
	expect(screen.getByRole("button", { name: "Creating…" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Creating…" })).toHaveAttribute(
		"aria-busy",
		"true"
	);
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	rerender(<ProjectForm onCancel={onCancel} onSubmit={vi.fn()} />);
	await user.click(screen.getByRole("button", { name: "Cancel" }));
	expect(onCancel).toHaveBeenCalledOnce();
});
it("edits prefilled values and shows saving state", async () => {
	const onSubmit = vi.fn().mockResolvedValue(undefined);
	const props = {
		mode: "edit" as const,
		initialValues: { name: "Emerald", code: "EG2" },
		onSubmit,
		onCancel: vi.fn(),
	};
	const { rerender } = render(<ProjectForm {...props} />);
	expect(screen.getByLabelText("Project name")).toHaveValue("Emerald");
	await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
	expect(onSubmit).toHaveBeenCalledWith({ name: "Emerald", code: "EG2" });
	rerender(<ProjectForm {...props} pending />);
	expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
});
