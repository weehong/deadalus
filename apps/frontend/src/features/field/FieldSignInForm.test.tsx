import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FieldSignInForm } from "@/features/field/FieldSignInForm";

describe("FieldSignInForm", () => {
	it("refuses a blank phone with the message tied to the control and no call", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<FieldSignInForm onSubmit={onSubmit} />);
		await user.click(screen.getByRole("button", { name: "Enter the Field" }));
		const phone = screen.getByRole("textbox", { name: "Phone number" });
		expect(await screen.findByText("Enter your phone number")).toBeVisible();
		expect(phone).toHaveAttribute("aria-invalid", "true");
		expect(phone).toHaveAccessibleDescription("Enter your phone number");
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits the phone as typed, also on Enter", async () => {
		const user = userEvent.setup();
		const onSubmit = vi.fn();
		render(<FieldSignInForm onSubmit={onSubmit} />);
		await user.type(
			screen.getByRole("textbox", { name: "Phone number" }),
			"9123 4567{Enter}"
		);
		expect(onSubmit).toHaveBeenCalledWith({ phone: "9123 4567" });
	});

	it("is a phone control for the keyboard and autofill, with a 44px target", () => {
		render(<FieldSignInForm onSubmit={vi.fn()} />);
		const phone = screen.getByRole("textbox", { name: "Phone number" });
		expect(phone).toHaveAttribute("type", "tel");
		expect(phone).toHaveAttribute("inputmode", "tel");
		expect(phone).toHaveAttribute("autocomplete", "tel");
		expect(phone).toHaveClass("h-[44px]");
		expect(screen.getByRole("button", { name: "Enter the Field" })).toHaveClass(
			"h-[44px]"
		);
	});

	it("refuses a second press while pending", () => {
		render(<FieldSignInForm pending onSubmit={vi.fn()} />);
		const submit = screen.getByRole("button", { name: "Signing in…" });
		expect(submit).toBeDisabled();
		expect(submit).toHaveAttribute("aria-busy", "true");
	});

	it("announces a supplied failure and clears it once the input changes", async () => {
		const user = userEvent.setup();
		render(
			<FieldSignInForm
				error="That phone number is not registered"
				onSubmit={vi.fn()}
			/>
		);
		expect(screen.getByRole("alert")).toHaveTextContent(
			"That phone number is not registered"
		);
		await user.type(screen.getByRole("textbox", { name: "Phone number" }), "9");
		expect(screen.queryByRole("alert")).not.toBeInTheDocument();
	});
});
