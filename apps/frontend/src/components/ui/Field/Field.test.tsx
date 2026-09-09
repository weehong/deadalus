import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/Input";
import { Field } from "./Field";

describe("Field", () => {
	it("associates the label with the control", () => {
		render(
			<Field id="email" label="Work email">
				<Input />
			</Field>
		);
		const input = screen.getByLabelText("Work email");
		expect(input).toHaveAttribute("id", "email");
		expect(input).not.toHaveAttribute("aria-invalid");
	});

	it("marks the control invalid and describes it by the error", () => {
		render(
			<Field error="Work email is required" id="email" label="Work email">
				<Input />
			</Field>
		);
		const input = screen.getByLabelText("Work email");
		expect(input).toHaveAttribute("aria-invalid", "true");
		expect(input).toHaveAccessibleDescription("Work email is required");
	});
});
