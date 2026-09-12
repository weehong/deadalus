import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LatestEntryLine } from "./LatestEntryLine";

describe("LatestEntryLine", () => {
	it("names the latest entry's value, author and moment with a machine-readable time", () => {
		render(
			<LatestEntryLine
				latest={{
					value: 45,
					note: "Doors hung",
					enteredByName: "Alex Tan",
					createdAt: "2026-09-10T12:00:00.000Z",
				}}
			/>
		);
		const line = screen.getByText(/^Latest 45% by Alex Tan/);
		expect(line).toBeVisible();
		expect(line).toHaveTextContent(/· Sep 10, 2026/);
		expect(line.querySelector("time")).toHaveAttribute(
			"datetime",
			"2026-09-10T12:00:00.000Z"
		);
	});

	it("says No entries yet without one", () => {
		render(<LatestEntryLine latest={null} />);
		expect(screen.getByText("No entries yet.")).toBeVisible();
	});
});
