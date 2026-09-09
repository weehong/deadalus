import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
	it("defaults to type=button and calls its handler", async () => {
		const user = userEvent.setup();
		const onClick = vi.fn();
		render(<Button onClick={onClick}>Press</Button>);
		const button = screen.getByRole("button", { name: "Press" });
		expect(button).toHaveAttribute("type", "button");
		await user.click(button);
		expect(onClick).toHaveBeenCalledOnce();
	});

	it("is disabled and busy while pending", () => {
		render(<Button pending>Saving</Button>);
		const button = screen.getByRole("button", { name: "Saving" });
		expect(button).toBeDisabled();
		expect(button).toHaveAttribute("aria-busy", "true");
	});

	it("exposes its variant and can be framed", () => {
		const { container } = render(
			<Button framed variant="secondary">
				Framed
			</Button>
		);
		expect(screen.getByRole("button")).toHaveAttribute(
			"data-variant",
			"secondary"
		);
		expect(container.querySelector(".blueprint-frame")).not.toBeNull();
	});
});
