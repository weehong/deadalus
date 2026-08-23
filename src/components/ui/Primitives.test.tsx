import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlueprintFrame } from "./BlueprintFrame";
import { Button } from "./Button";
import { Logo } from "./Logo";

describe("BlueprintFrame", () => {
	it("renders four decorative corner marks", () => {
		const { container } = render(<BlueprintFrame>Content</BlueprintFrame>);
		expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
		expect(screen.getByText("Content").classList.contains("border-rule")).toBe(
			true
		);
	});

	it("renders as another element and forwards its props", () => {
		render(
			<BlueprintFrame as="a" href="/example">
				Example
			</BlueprintFrame>
		);
		expect(
			screen.getByRole("link", { name: "Example" }).getAttribute("href")
		).toBe("/example");
	});
});

describe("Button", () => {
	it.each(["primary", "secondary", "ghost", "icon"] as const)(
		"renders the %s variant",
		(variant) => {
			render(<Button variant={variant}>Action</Button>);
			expect(
				screen
					.getByRole("button", { name: "Action" })
					.classList.contains("focus-visible:outline-signal-500")
			).toBe(true);
		}
	);

	it("fills its container and adds corner marks when framed", () => {
		const { container } = render(
			<Button block framed>
				Action
			</Button>
		);
		expect(
			screen
				.getByRole("button", { name: "Action" })
				.classList.contains("w-full")
		).toBe(true);
		expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
	});

	it.each([{ pending: true }, { disabled: true }])(
		"cannot activate when unavailable",
		(state) => {
			const onClick = vi.fn();
			render(
				<Button {...state} onClick={onClick}>
					Action
				</Button>
			);
			fireEvent.click(screen.getByRole("button", { name: "Action" }));
			expect(onClick).not.toHaveBeenCalled();
			expect(
				screen.getByRole<HTMLButtonElement>("button", { name: "Action" })
					.disabled
			).toBe(true);
		}
	);

	it("communicates pending state", () => {
		render(<Button pending>Saving</Button>);
		expect(
			screen.getByRole("button", { name: "Saving" }).getAttribute("aria-busy")
		).toBe("true");
	});
});

describe("Logo", () => {
	it.each(["small", "large"] as const)(
		"renders at %s size using inherited colour",
		(size) => {
			render(<Logo className="text-signal-500" size={size} />);
			expect(
				screen
					.getByLabelText("Daedalus Ops")
					.classList.contains("text-signal-500")
			).toBe(true);
		}
	);
});
