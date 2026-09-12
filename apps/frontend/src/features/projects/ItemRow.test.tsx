import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ItemRow } from "@/features/projects/ItemRow";
const directory = [
	{ id: "acme", name: "Acme Fitout" },
	{ id: "bolt", name: "Bolt Electrical" },
];
it("shows the Item's name, Subcontractor, Progression and latest entry, and assigns through its select", async () => {
	const user = userEvent.setup();
	const onAssign = vi.fn();
	render(
		<ItemRow
			subcontractors={directory}
			item={{
				id: "i1",
				catalogueItemId: "wardrobe",
				name: "Wardrobe",
				subcontractor: { id: "acme", name: "Acme Fitout" },
				assignedAt: "2026-09-01T00:00:00.000Z",
				progression: 45,
				latestEntry: {
					value: 45,
					note: "Doors hung",
					enteredByName: "administrator@example.com",
					createdAt: "2026-09-10T12:00:00.000Z",
				},
			}}
			onAssign={onAssign}
		/>
	);
	expect(screen.getByText("Wardrobe")).toBeVisible();
	expect(screen.getByText("Acme Fitout", { selector: "p" })).toBeVisible();
	expect(screen.getByText("45%")).toBeVisible();
	const latest = screen.getByText(/^Latest 45% by administrator@example\.com/);
	expect(latest).toBeVisible();
	expect(latest).toHaveTextContent(/· Sep 10, 2026/);
	expect(latest.querySelector("time")).toHaveAttribute(
		"datetime",
		"2026-09-10T12:00:00.000Z"
	);
	const select = screen.getByLabelText("Subcontractor for Wardrobe");
	expect(select).toHaveValue("acme");
	await user.selectOptions(select, "bolt");
	expect(onAssign).toHaveBeenCalledWith("bolt");
	await user.selectOptions(select, "Unassigned");
	expect(onAssign).toHaveBeenCalledWith(null);
});
it("says Unassigned and No entries yet for an Item with no Assignment, keeps a Subcontractor the Directory page does not list, and renders its details", () => {
	render(
		<ItemRow
			pending
			subcontractors={directory}
			item={{
				id: "i2",
				catalogueItemId: "sink",
				name: "Sink",
				subcontractor: { id: "zed", name: "Zed Plumbing" },
				assignedAt: "2026-09-01T00:00:00.000Z",
				progression: 0,
				latestEntry: null,
			}}
			onAssign={vi.fn()}
		/>
	);
	const select = screen.getByLabelText("Subcontractor for Sink");
	expect(select).toHaveValue("zed");
	expect(select).toBeDisabled();
	expect(screen.getByRole("option", { name: "Zed Plumbing" })).toBeVisible();
	render(
		<ItemRow
			subcontractors={directory}
			item={{
				id: "i3",
				catalogueItemId: "sink",
				name: "Sink",
				subcontractor: null,
				assignedAt: null,
				progression: 0,
				latestEntry: null,
			}}
			onAssign={vi.fn()}
		>
			<p>Entry form and History go here</p>
		</ItemRow>
	);
	expect(screen.getByText("Unassigned", { selector: "p" })).toBeVisible();
	expect(screen.getAllByLabelText("Subcontractor for Sink")[1]).toHaveValue("");
	expect(screen.getAllByText("No entries yet.")).toHaveLength(2);
	expect(screen.getByText("Entry form and History go here")).toBeVisible();
});
