import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ProgressionBadge } from "./ProgressionBadge";
it.each([
	[45.4, "45%"],
	[45.5, "46%"],
	[0, "0%"],
	[100, "100%"],
])("rounds %s to the whole-number percentage %s", (progression, text) => {
	render(<ProgressionBadge progression={progression} />);
	expect(screen.getByText(text)).toBeVisible();
});
it("is blank with an accessible No Items label when there are no Items", () => {
	const { container } = render(<ProgressionBadge progression={null} />);
	expect(container).not.toHaveTextContent("%");
	expect(container).not.toHaveTextContent("0");
	const label = screen.getByText("No Items");
	expect(label).toHaveClass("sr-only");
});
