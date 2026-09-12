import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { RemoveCatalogueItemDialog } from "@/features/projects/RemoveCatalogueItemDialog";
import type { Project } from "@/features/projects/types";
const none = { itemCount: 0, entryCount: 0, progression: null, items: [] };
const wardrobeOnly = (
	entryCount: number
): Pick<
	Project["blocks"][number]["storeys"][number]["units"][number],
	"itemCount" | "entryCount" | "progression" | "items"
> => ({
	itemCount: 1,
	entryCount,
	progression: 0,
	items: [{ catalogueItemId: "wardrobe", subcontractorId: null, entryCount }],
});
// Wardrobe is held by u1 (3 entries, beside a Sink with 1), u2 (3 entries)
// and u4 (none); Sink by u1 alone.
const project: Project = {
	id: "gardens",
	name: "Gardens",
	code: "EG2",
	itemCount: 4,
	entryCount: 7,
	progression: 0,
	blocks: [
		{
			id: "a",
			name: "A",
			position: 0,
			itemCount: 3,
			entryCount: 7,
			progression: 0,
			storeys: [
				{
					id: "a1",
					name: "01",
					position: 0,
					itemCount: 3,
					entryCount: 7,
					progression: 0,
					units: [
						{
							id: "u1",
							name: "01",
							position: 0,
							unitTypeId: "as1",
							itemCount: 2,
							entryCount: 4,
							progression: 0,
							items: [
								{
									catalogueItemId: "sink",
									subcontractorId: null,
									entryCount: 1,
								},
								{
									catalogueItemId: "wardrobe",
									subcontractorId: null,
									entryCount: 3,
								},
							],
						},
						{
							id: "u2",
							name: "02",
							position: 1,
							unitTypeId: "bp2",
							...wardrobeOnly(3),
						},
					],
				},
				{
					id: "a2",
					name: "02",
					position: 1,
					...none,
					units: [
						{ id: "u3", name: "01", position: 0, unitTypeId: "as1", ...none },
					],
				},
			],
		},
		{
			id: "b",
			name: "B",
			position: 1,
			itemCount: 1,
			entryCount: 0,
			progression: 0,
			storeys: [
				{
					id: "b1",
					name: "01",
					position: 0,
					itemCount: 1,
					entryCount: 0,
					progression: 0,
					units: [
						{
							id: "u4",
							name: "01",
							position: 0,
							unitTypeId: "bp2",
							...wardrobeOnly(0),
						},
						{ id: "u5", name: "02", position: 1, unitTypeId: null, ...none },
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
		{ id: "sink", name: "Sink", itemCount: 1 },
		{ id: "wardrobe", name: "Wardrobe", itemCount: 3 },
	],
};
const wardrobe = project.catalogueItems[1]!;
it("previews the Item count, asks for confirmation naming the Items and entries, then submits the narrowed filters", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn((): Promise<never> => new Promise(() => {}));
	render(
		<RemoveCatalogueItemDialog
			catalogueItem={wardrobe}
			project={project}
			onClose={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	expect(
		screen.getByRole("dialog", { name: "Remove Wardrobe from Units" })
	).toBeVisible();
	expect(screen.getByRole("status")).toHaveTextContent("Will remove 3 Items.");
	expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
	await user.click(screen.getByRole("button", { name: "Continue" }));
	// u1's Sink entry is not counted: the summary carries each Item's own.
	expect(screen.getByRole("status")).toHaveTextContent(
		"Remove 3 Items and 6 Progress entries? This cannot be undone."
	);
	expect(screen.getByLabelText("Block")).toBeDisabled();
	await user.click(screen.getByRole("button", { name: "Back" }));
	expect(screen.getByLabelText("Block")).toBeEnabled();
	await user.selectOptions(screen.getByLabelText("Block"), "a");
	await user.click(screen.getByRole("checkbox", { name: "AS1" }));
	expect(screen.getByRole("status")).toHaveTextContent("Will remove 1 Item.");
	await user.click(screen.getByRole("button", { name: "Continue" }));
	expect(screen.getByRole("status")).toHaveTextContent(
		"Remove 1 Item and 3 Progress entries? This cannot be undone."
	);
	await user.click(screen.getByRole("button", { name: "Remove" }));
	expect(onSubmit).toHaveBeenCalledWith({
		blockIds: ["a"],
		unitTypeIds: ["bp2"],
	});
});
it("lets a selection holding nothing through with zeros and refuses an emptied list", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn((): Promise<never> => new Promise(() => {}));
	render(
		<RemoveCatalogueItemDialog
			catalogueItem={project.catalogueItems[0]!}
			project={project}
			onClose={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	await user.selectOptions(screen.getByLabelText("Block"), "b");
	expect(screen.getByRole("status")).toHaveTextContent("Will remove 0 Items.");
	await user.click(screen.getByLabelText("Select all Storeys"));
	expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
	await user.click(screen.getByLabelText("Select all Storeys"));
	await user.click(screen.getByRole("button", { name: "Continue" }));
	expect(screen.getByRole("status")).toHaveTextContent(
		"Remove 0 Items and 0 Progress entries? This cannot be undone."
	);
	await user.click(screen.getByRole("button", { name: "Remove" }));
	expect(onSubmit).toHaveBeenCalledWith({ blockIds: ["b"] });
});
it("shows busy while the remove runs, the failure when it is refused, then the API's counts and closes", async () => {
	const user = userEvent.setup();
	const onClose = vi.fn();
	let settle: (result: {
		removed: number;
		entriesRemoved: number;
	}) => void = () => {};
	const onSubmit = vi
		.fn<() => Promise<{ removed: number; entriesRemoved: number }>>()
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					settle = resolve;
				})
		)
		.mockRejectedValueOnce(new Error("Boom"))
		.mockResolvedValueOnce({ removed: 3, entriesRemoved: 3 });
	render(
		<RemoveCatalogueItemDialog
			defaultConfirming
			catalogueItem={wardrobe}
			project={project}
			onClose={onClose}
			onSubmit={onSubmit}
		/>
	);
	const remove = screen.getByRole("button", { name: "Remove" });
	await user.click(remove);
	expect(remove).toHaveAttribute("aria-busy", "true");
	expect(screen.getByRole("button", { name: "Back" })).toBeDisabled();
	expect(screen.getByLabelText("Block")).toBeDisabled();
	settle({ removed: 0, entriesRemoved: 0 });
	await waitFor(() => {
		expect(screen.getByRole("status")).toHaveTextContent("Removed 0 Items");
	});
	await user.click(screen.getByRole("button", { name: "Close" }));
	expect(onClose).toHaveBeenCalledOnce();
	cleanup();
	render(
		<RemoveCatalogueItemDialog
			defaultConfirming
			catalogueItem={wardrobe}
			project={project}
			onClose={onClose}
			onSubmit={onSubmit}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Remove" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Could not remove the Items. Try again."
	);
	expect(screen.getByRole("button", { name: "Back" })).toBeEnabled();
	await user.click(screen.getByRole("button", { name: "Remove" }));
	expect(await screen.findByRole("status")).toHaveTextContent(
		"Removed 3 Items and 3 Progress entries."
	);
	expect(screen.queryByRole("alert")).toBeNull();
	expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
	expect(screen.queryByRole("button", { name: "Continue" })).toBeNull();
	expect(screen.getByLabelText("Block")).toBeDisabled();
	expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Close" }));
	expect(onClose).toHaveBeenCalledTimes(2);
});
