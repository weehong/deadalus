import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BootLoadingState } from "./LoadingState";

describe("BootLoadingState", () => {
	it("announces that the session is being restored", () => {
		render(<BootLoadingState />);
		const status = screen.getByRole("status");
		expect(status).toHaveAttribute("aria-busy", "true");
		expect(status).toHaveTextContent("Restoring your session…");
	});
});
