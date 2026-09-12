import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { AssignCatalogueItemDialog } from "@/features/projects/AssignCatalogueItemDialog";
import type { Project } from "@/features/projects/types";
const wardrobe = (
	subcontractorId: string | null
): {
	itemCount: number;
	entryCount: number;
	progression: number;
	items: Array<{
		catalogueItemId: string;
		subcontractorId: string | null;
		entryCount: number;
	}>;
} => ({
	itemCount: 1,
	entryCount: 0,
	progression: 0,
	items: [{ catalogueItemId: "wardrobe", subcontractorId, entryCount: 0 }],
});
// Wardrobe: u1 unassigned, u2 Bolt, u3 unassigned (Block A); u4 Acme, u5 unassigned (Block B).
const project: Project = {
	id: "gardens",
	name: "Gardens",
	code: "EG2",
	itemCount: 5,
	entryCount: 0,
	progression: 0,
	blocks: [
		{
			id: "a",
			name: "A",
			position: 0,
			itemCount: 3,
			entryCount: 0,
			progression: 0,
			storeys: [
				{
					id: "a1",
					name: "01",
					position: 0,
					itemCount: 2,
					entryCount: 0,
					progression: 0,
					units: [
						{
							id: "u1",
							name: "01",
							position: 0,
							unitTypeId: "as1",
							...wardrobe(null),
						},
						{
							id: "u2",
							name: "02",
							position: 1,
							unitTypeId: "bp2",
							...wardrobe("bolt"),
						},
					],
				},
				{
					id: "a2",
					name: "02",
					position: 1,
					itemCount: 1,
					entryCount: 0,
					progression: 0,
					units: [
						{
							id: "u3",
							name: "01",
							position: 0,
							unitTypeId: "as1",
							...wardrobe(null),
						},
					],
				},
			],
		},
		{
			id: "b",
			name: "B",
			position: 1,
			itemCount: 2,
			entryCount: 0,
			progression: 0,
			storeys: [
				{
					id: "b1",
					name: "01",
					position: 0,
					itemCount: 2,
					entryCount: 0,
					progression: 0,
					units: [
						{
							id: "u4",
							name: "01",
							position: 0,
							unitTypeId: "bp2",
							...wardrobe("acme"),
						},
						{
							id: "u5",
							name: "02",
							position: 1,
							unitTypeId: null,
							...wardrobe(null),
						},
					],
				},
			],
		},
	],
	unitTypes: [
		{ id: "as1", code: "AS1", description: null, unitCount: 2 },
		{ id: "bp2", code: "BP2", description: null, unitCount: 2 },
	],
	catalogueItems: [
		{ id: "wardrobe", name: "Wardrobe", itemCount: 5 },
		{ id: "sink", name: "Sink", itemCount: 0 },
	],
};
const catalogueItem = project.catalogueItems[0]!;
const directory = [
	{ id: "acme", name: "Acme Fitout" },
	{ id: "bolt", name: "Bolt Electrical" },
];
it("previews exactly what one click does for a chosen Subcontractor, with and without reassign, and submits the body", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn((): Promise<never> => new Promise(() => {}));
	render(
		<AssignCatalogueItemDialog
			catalogueItem={catalogueItem}
			project={project}
			subcontractors={directory}
			onClose={vi.fn()}
			onSearch={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	expect(screen.getByRole("dialog", { name: "Assign Wardrobe" })).toBeVisible();
	expect(screen.getByRole("status")).toHaveTextContent(
		"Choose a Subcontractor, or Unassign."
	);
	expect(screen.getByRole("button", { name: "Assign" })).toBeDisabled();
	await user.selectOptions(screen.getByLabelText("Subcontractor"), "acme");
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will assign 3 Items; 1 already assigned elsewhere will be skipped; 1 already assigned to Acme Fitout."
	);
	await user.click(
		screen.getByRole("checkbox", {
			name: "Reassign Items already assigned elsewhere",
		})
	);
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will assign 3 Items; 1 already assigned elsewhere will be reassigned; 1 already assigned to Acme Fitout."
	);
	await user.selectOptions(screen.getByLabelText("Block"), "a");
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will assign 2 Items; 1 already assigned elsewhere will be reassigned."
	);
	await user.click(screen.getByRole("button", { name: "Assign" }));
	expect(onSubmit).toHaveBeenCalledWith({
		catalogueItemId: "wardrobe",
		subcontractorId: "acme",
		reassign: true,
		blockIds: ["a"],
	});
});
it("offers Unassign, previews it and submits null", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn((): Promise<never> => new Promise(() => {}));
	render(
		<AssignCatalogueItemDialog
			catalogueItem={catalogueItem}
			project={project}
			subcontractors={directory}
			onClose={vi.fn()}
			onSearch={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	await user.selectOptions(screen.getByLabelText("Subcontractor"), "Unassign");
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will unassign 2 Items; 3 with no Assignment will be skipped."
	);
	expect(
		screen.getByRole("checkbox", {
			name: "Reassign Items already assigned elsewhere",
		})
	).toBeDisabled();
	await user.click(screen.getByRole("checkbox", { name: "BP2" }));
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will unassign 0 Items; 2 with no Assignment will be skipped."
	);
	await user.click(screen.getByRole("button", { name: "Unassign" }));
	expect(onSubmit).toHaveBeenCalledWith({
		catalogueItemId: "wardrobe",
		subcontractorId: null,
		unitTypeIds: ["as1"],
	});
});
it("searches the Directory, keeps the chosen Subcontractor when the results move on, and refuses an emptied selection", async () => {
	const user = userEvent.setup();
	const onSearch = vi.fn();
	const { rerender } = render(
		<AssignCatalogueItemDialog
			catalogueItem={catalogueItem}
			project={project}
			subcontractors={directory}
			onClose={vi.fn()}
			onSearch={onSearch}
			onSubmit={vi.fn()}
		/>
	);
	await user.selectOptions(screen.getByLabelText("Subcontractor"), "bolt");
	await user.type(screen.getByLabelText("Search the Directory"), "ac");
	expect(onSearch).toHaveBeenLastCalledWith("ac");
	rerender(
		<AssignCatalogueItemDialog
			searching
			catalogueItem={catalogueItem}
			project={project}
			subcontractors={[directory[0]!]}
			onClose={vi.fn()}
			onSearch={onSearch}
			onSubmit={vi.fn()}
		/>
	);
	expect(screen.getByLabelText("Subcontractor")).toHaveValue("bolt");
	expect(
		screen.getByRole("option", { name: "Bolt Electrical" })
	).toBeInTheDocument();
	expect(
		screen.getByRole("option", { name: "Acme Fitout" })
	).toBeInTheDocument();
	expect(screen.getByText("Searching the Directory…")).toBeVisible();
	rerender(
		<AssignCatalogueItemDialog
			catalogueItem={catalogueItem}
			project={project}
			subcontractors={[]}
			onClose={vi.fn()}
			onSearch={onSearch}
			onSubmit={vi.fn()}
		/>
	);
	expect(screen.getByText("No Subcontractors match.")).toBeVisible();
	await user.click(screen.getByLabelText("Select all Storeys"));
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will assign 0 Items; 0 already assigned elsewhere will be skipped."
	);
	expect(screen.getByRole("button", { name: "Assign" })).toBeDisabled();
});
it("shows busy while the assign runs, the failure when it is refused, then the result and closes", async () => {
	const user = userEvent.setup();
	const onClose = vi.fn();
	let settle: (result: {
		assigned: number;
		skipped: number;
	}) => void = () => {};
	const onSubmit = vi
		.fn<() => Promise<{ assigned: number; skipped: number }>>()
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					settle = resolve;
				})
		)
		.mockRejectedValueOnce(new Error("Boom"))
		.mockResolvedValueOnce({ assigned: 3, skipped: 2 });
	render(
		<AssignCatalogueItemDialog
			catalogueItem={catalogueItem}
			project={project}
			subcontractors={directory}
			onClose={onClose}
			onSearch={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	await user.selectOptions(screen.getByLabelText("Subcontractor"), "acme");
	const assign = screen.getByRole("button", { name: "Assign" });
	await user.click(assign);
	expect(assign).toHaveAttribute("aria-busy", "true");
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	expect(screen.getByLabelText("Subcontractor")).toBeDisabled();
	settle({ assigned: 0, skipped: 0 });
	await waitFor(() => {
		expect(screen.getByRole("status")).toHaveTextContent("Assigned 0 Items");
	});
	await user.click(screen.getByRole("button", { name: "Close" }));
	expect(onClose).toHaveBeenCalledOnce();
	cleanup();
	render(
		<AssignCatalogueItemDialog
			catalogueItem={catalogueItem}
			project={project}
			subcontractors={directory}
			onClose={onClose}
			onSearch={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	await user.selectOptions(screen.getByLabelText("Subcontractor"), "acme");
	await user.click(screen.getByRole("button", { name: "Assign" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Could not assign the Items. Try again."
	);
	expect(screen.getByLabelText("Subcontractor")).toBeEnabled();
	await user.click(screen.getByRole("button", { name: "Assign" }));
	expect(await screen.findByRole("status")).toHaveTextContent(
		"Assigned 3 Items; skipped 2."
	);
	expect(screen.queryByRole("alert")).toBeNull();
	expect(screen.queryByRole("button", { name: "Assign" })).toBeNull();
	expect(screen.getByLabelText("Subcontractor")).toBeDisabled();
	expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Close" }));
	expect(onClose).toHaveBeenCalledTimes(2);
});
