import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ProgressHistory } from "./ProgressHistory";
import type { ProgressEntry } from "@/common/items";
const entries: Array<ProgressEntry> = [
	{
		id: "e2",
		value: 60,
		note: null,
		enteredByKind: "member",
		enteredByName: "Alex",
		subcontractorName: "Acme Fitout",
		createdAt: "2026-09-09T12:00:00.000Z",
	},
	{
		id: "e1",
		value: 20,
		note: "Carcass in",
		enteredByKind: "administrator",
		enteredByName: "administrator@example.com",
		subcontractorName: null,
		createdAt: "2026-09-08T12:00:00.000Z",
	},
];
it("opens on demand and lists the entries in the order given with author, date and note", async () => {
	const user = userEvent.setup();
	const onToggle = vi.fn();
	const { rerender } = render(
		<ProgressHistory itemName="Sink" open={false} onToggle={onToggle} />
	);
	const toggle = screen.getByRole("button", { name: "History" });
	expect(toggle).toHaveAttribute("aria-expanded", "false");
	expect(screen.queryByRole("list")).toBeNull();
	await user.click(toggle);
	expect(onToggle).toHaveBeenCalledOnce();
	rerender(
		<ProgressHistory loading open itemName="Sink" onToggle={onToggle} />
	);
	expect(screen.getByRole("status")).toHaveTextContent("Loading history…");
	rerender(
		<ProgressHistory
			open
			entries={entries}
			itemName="Sink"
			onToggle={onToggle}
		/>
	);
	expect(toggle).toHaveAttribute("aria-expanded", "true");
	const list = screen.getByRole("list", { name: "History for Sink" });
	const rows = within(list).getAllByRole("listitem");
	expect(rows).toHaveLength(2);
	expect(rows[0]).toHaveTextContent("60% by Alex (Acme Fitout)");
	expect(rows[0]).toHaveTextContent(/Sep 9, 2026/);
	expect(rows[0]).not.toHaveTextContent("Carcass in");
	expect(rows[1]).toHaveTextContent(
		"20% by administrator@example.com (Administrator)"
	);
	expect(rows[1]).toHaveTextContent(/Sep 8, 2026/);
	expect(rows[1]).toHaveTextContent("Carcass in");
	expect(rows[0]!.querySelector("time")).toHaveAttribute(
		"datetime",
		"2026-09-09T12:00:00.000Z"
	);
});
it("shows an empty history and a failed read with retry", async () => {
	const user = userEvent.setup();
	const onRetry = vi.fn();
	const { rerender } = render(
		<ProgressHistory open entries={[]} itemName="Sink" onToggle={vi.fn()} />
	);
	expect(screen.getByText("No entries yet.")).toBeVisible();
	expect(screen.queryByRole("list")).toBeNull();
	rerender(
		<ProgressHistory
			open
			error="Could not load the history. Try again."
			itemName="Sink"
			onRetry={onRetry}
			onToggle={vi.fn()}
		/>
	);
	expect(screen.getByRole("alert")).toHaveTextContent(
		"Could not load the history. Try again."
	);
	await user.click(screen.getByRole("button", { name: "Retry" }));
	expect(onRetry).toHaveBeenCalledOnce();
});
