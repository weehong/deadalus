import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { UnitItemsDisclosure } from "@/features/projects/UnitItemsDisclosure";
const directory = [
	{ id: "acme", name: "Acme Fitout" },
	{ id: "bolt", name: "Bolt Electrical" },
];
const items = [
	{
		id: "i1",
		catalogueItemId: "sink",
		name: "Sink",
		subcontractor: null,
		assignedAt: null,
		progression: 0,
		latestEntry: null,
	},
	{
		id: "i2",
		catalogueItemId: "wardrobe",
		name: "Wardrobe",
		subcontractor: { id: "acme", name: "Acme Fitout" },
		assignedAt: "2026-09-01T00:00:00.000Z",
		progression: 45,
		latestEntry: {
			value: 45,
			note: null,
			enteredByName: "administrator@example.com",
			createdAt: "2026-09-10T12:00:00.000Z",
		},
	},
];
it("opens on demand, lists the Items and assigns one", async () => {
	const user = userEvent.setup();
	const onToggle = vi.fn();
	const onAssign = vi.fn();
	const { rerender } = render(
		<UnitItemsDisclosure
			open={false}
			subcontractors={directory}
			onAssign={onAssign}
			onToggle={onToggle}
		/>
	);
	const toggle = screen.getByRole("button", { name: "Items" });
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(screen.queryByRole("list")).toBeNull();
	await user.click(toggle);
	expect(onToggle).toHaveBeenCalledOnce();
	rerender(
		<UnitItemsDisclosure
			loading
			open
			subcontractors={directory}
			onAssign={onAssign}
			onToggle={onToggle}
		/>
	);
	expect(screen.getByRole("status")).toHaveTextContent("Loading Items…");
	rerender(
		<UnitItemsDisclosure
			open
			items={items}
			subcontractors={directory}
			onAssign={onAssign}
			onToggle={onToggle}
		/>
	);
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	const rows = screen.getAllByRole("listitem");
	expect(rows).toHaveLength(2);
	expect(rows[0]).toHaveTextContent("Sink");
	expect(rows[0]).toHaveTextContent("Unassigned");
	expect(rows[1]).toHaveTextContent("Wardrobe");
	expect(rows[1]).toHaveTextContent("Acme Fitout");
	expect(rows[1]).toHaveTextContent("45%");
	await user.selectOptions(
		screen.getByLabelText("Subcontractor for Sink"),
		"bolt"
	);
	expect(onAssign).toHaveBeenCalledWith(items[0], "bolt");
});
it("shows an empty Unit, a failed read with retry, and a failed Assignment", async () => {
	const user = userEvent.setup();
	const onRetry = vi.fn();
	const { rerender } = render(
		<UnitItemsDisclosure
			open
			items={[]}
			subcontractors={directory}
			onAssign={vi.fn()}
			onToggle={vi.fn()}
		/>
	);
	expect(screen.getByText("No Items in this Unit.")).toBeVisible();
	rerender(
		<UnitItemsDisclosure
			open
			error="Could not load the Items. Try again."
			subcontractors={directory}
			onAssign={vi.fn()}
			onRetry={onRetry}
			onToggle={vi.fn()}
		/>
	);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not load the Items. Try again."
	);
	await user.click(screen.getByRole("button", { name: "Retry" }));
	expect(onRetry).toHaveBeenCalledOnce();
	rerender(
		<UnitItemsDisclosure
			open
			assignError="Could not change the Assignment. Try again."
			items={items}
			pendingItemId="i2"
			subcontractors={directory}
			onAssign={vi.fn()}
			onToggle={vi.fn()}
		/>
	);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not change the Assignment. Try again."
	);
	expect(screen.getByLabelText("Subcontractor for Wardrobe")).toBeDisabled();
	expect(screen.getByLabelText("Subcontractor for Sink")).toBeEnabled();
});
