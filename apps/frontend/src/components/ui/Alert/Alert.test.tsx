import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Alert } from "./Alert";

describe("Alert", () => {
	it("is an assertive live region carrying its message", () => {
		render(<Alert>Rejected</Alert>);
		const alert = screen.getByRole("alert");
		expect(alert).toHaveTextContent("Rejected");
		expect(alert).toHaveAttribute("aria-live", "assertive");
	});
});
