import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FieldItemRow } from "@/features/field/FieldItemRow";

describe("FieldItemRow", () => {
	it("shows the Item's name, its Progression and its latest entry with the moment, and renders its details beneath", () => {
		render(
			<FieldItemRow
				item={{
					id: "i1",
					catalogueItemId: "wardrobe",
					name: "Wardrobe",
					subcontractor: { id: "acme", name: "Acme Joinery" },
					assignedAt: "2026-09-01T00:00:00.000Z",
					progression: 45.4,
					latestEntry: {
						value: 45,
						note: "Doors hung",
						enteredByName: "Alex Tan",
						createdAt: "2026-09-10T12:00:00.000Z",
					},
				}}
			>
				<p>Entry form and History go here</p>
			</FieldItemRow>
		);
		expect(
			screen.getByRole("heading", { level: 2, name: "Wardrobe" })
		).toBeVisible();
		expect(screen.getByText("45%")).toBeVisible();
		const latest = screen.getByText(/^Latest 45% by Alex Tan/);
		expect(latest).toBeVisible();
		expect(latest).toHaveTextContent(/· Sep 10, 2026/);
		expect(latest.querySelector("time")).toHaveAttribute(
			"datetime",
			"2026-09-10T12:00:00.000Z"
		);
		expect(screen.getByText("Entry form and History go here")).toBeVisible();
	});

	it("says No entries yet for an Item without one", () => {
		render(
			<FieldItemRow
				item={{
					id: "i2",
					catalogueItemId: "sink",
					name: "Sink",
					subcontractor: { id: "acme", name: "Acme Joinery" },
					assignedAt: "2026-09-01T00:00:00.000Z",
					progression: 0,
					latestEntry: null,
				}}
			/>
		);
		expect(
			screen.getByRole("heading", { level: 2, name: "Sink" })
		).toBeVisible();
		expect(screen.getByText("0%")).toBeVisible();
		expect(screen.getByText("No entries yet.")).toBeVisible();
	});
});
