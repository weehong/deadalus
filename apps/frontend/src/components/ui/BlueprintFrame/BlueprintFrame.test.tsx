import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BlueprintFrame } from "./BlueprintFrame";

describe("BlueprintFrame", () => {
	it("renders its content inside a frame with four hidden corner marks", () => {
		const { container } = render(<BlueprintFrame>Framed</BlueprintFrame>);
		expect(screen.getByText("Framed")).toBeInTheDocument();
		expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(4);
	});

	it("renders as the requested element and forwards attributes", () => {
		render(
			<BlueprintFrame aria-label="Panel" as="section">
				Content
			</BlueprintFrame>
		);
		const panel = screen.getByRole("region", { name: "Panel" });
		expect(panel.tagName).toBe("SECTION");
	});
});
