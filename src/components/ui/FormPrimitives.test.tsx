import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";
import { Field } from "./Field";
import { Input } from "./Input";

describe("form primitives", () => {
	it("forwards an input ref", () => {
		const ref = createRef<HTMLInputElement>();
		render(<Input ref={ref} aria-label="Reference input" />);
		expect(ref.current).toBe(screen.getByRole("textbox", { name: "Reference input" }));
	});

	it("associates a field label with its control", async () => {
		const user = userEvent.setup();
		render(<Field id="site" label="Site"><Input /></Field>);
		await user.click(screen.getByText("Site"));
		expect(document.activeElement).toBe(screen.getByRole("textbox", { name: "Site" }));
		expect(screen.getByRole("textbox").hasAttribute("aria-invalid")).toBe(false);
		expect(screen.queryByText(/required/i)).toBeNull();
	});

	it("describes an invalid control with its error", () => {
		render(<Field error="Site is required" id="site" label="Site"><Input /></Field>);
		const control = screen.getByRole("textbox", { name: "Site" });
		expect(control.getAttribute("aria-invalid")).toBe("true");
		expect(control.getAttribute("aria-describedby")).toBe("site-error");
		expect(screen.getByText("Site is required").id).toBe("site-error");
	});

	it("renders an assertive alert without receiving focus", () => {
		render(<Alert>Request failed</Alert>);
		const alert = screen.getByRole("alert");
		expect(alert.getAttribute("aria-live")).toBe("assertive");
		expect(document.activeElement).not.toBe(alert);
	});
});
