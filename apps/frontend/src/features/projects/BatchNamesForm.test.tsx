import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { BatchNamesForm } from "@/features/projects/BatchNamesForm";
it("previews list names, marks clashes and refuses submission until corrected", async () => {
	const user = userEvent.setup();
	const submit = vi.fn();
	render(
		<BatchNamesForm
			existingNames={["A"]}
			onCancel={vi.fn()}
			onSubmit={submit}
		/>
	);
	await user.click(screen.getByRole("radio", { name: "List" }));
	await user.type(screen.getByLabelText("Names, one per line"), "A\nB\nb");
	expect(screen.getByText("3 names")).toBeVisible();
	expect(screen.getByText("Already exists")).toBeVisible();
	expect(screen.getAllByText("Repeated")).toHaveLength(2);
	expect(screen.getByRole("button", { name: "Add names" })).toBeDisabled();
	await user.clear(screen.getByLabelText("Names, one per line"));
	await user.type(screen.getByLabelText("Names, one per line"), " C \nD");
	await user.click(screen.getByRole("button", { name: "Add names" }));
	expect(submit).toHaveBeenCalledWith(["C", "D"]);
});
it("shows a busy state and inline server failure", () => {
	render(
		<BatchNamesForm
			pending
			error="Names already exist: A"
			existingNames={[]}
			onCancel={vi.fn()}
			onSubmit={vi.fn()}
		/>
	);
	expect(screen.getByRole("alert")).toHaveTextContent("Names already exist: A");
	expect(screen.getByRole("button", { name: "Adding…" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
});
it("renders validation and actions in Chinese", async () => {
	const { default: i18n } = await import("@/common/i18n");
	await i18n.changeLanguage("zh-CN");
	try {
		const user = userEvent.setup();
		render(
			<BatchNamesForm
				existingNames={["1"]}
				onCancel={vi.fn()}
				onSubmit={vi.fn()}
			/>
		);
		expect(screen.getByText("已存在")).toBeVisible();
		expect(screen.getByRole("button", { name: "添加名称" })).toBeDisabled();
		await user.click(screen.getByRole("radio", { name: "列表" }));
		expect(screen.getByLabelText("名称，每行一个")).toBeVisible();
	} finally {
		await i18n.changeLanguage("en-US");
	}
});
