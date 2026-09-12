import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { ApplyCatalogueItemDialog } from "@/features/projects/ApplyCatalogueItemDialog";
import type { Project } from "@/features/projects/types";
const none = { itemCount: 0, entryCount: 0, progression: null, items: [] };
const one = {
	itemCount: 1,
	entryCount: 0,
	progression: 0,
	items: [
		{ catalogueItemId: "wardrobe", subcontractorId: null, entryCount: 0 },
	],
};
// Wardrobe is held by u1 and u2 in Block A Storey 01.
const project: Project = {
	id: "gardens",
	name: "Gardens",
	code: "EG2",
	itemCount: 2,
	entryCount: 0,
	progression: 0,
	blocks: [
		{
			id: "a",
			name: "A",
			position: 0,
			itemCount: 2,
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
						{ id: "u1", name: "01", position: 0, unitTypeId: "as1", ...one },
						{ id: "u2", name: "02", position: 1, unitTypeId: "bp2", ...one },
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
			...none,
			storeys: [
				{
					id: "b1",
					name: "01",
					position: 0,
					...none,
					units: [
						{ id: "u4", name: "01", position: 0, unitTypeId: "bp2", ...none },
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
	catalogueItems: [{ id: "wardrobe", name: "Wardrobe", itemCount: 2 }],
};
const wardrobe = project.catalogueItems[0]!;
it("previews what one click does as the selection changes and submits the narrowed filters", async () => {
	const user = userEvent.setup();
	const onSubmit = vi.fn((): Promise<never> => new Promise(() => {}));
	render(
		<ApplyCatalogueItemDialog
			catalogueItem={wardrobe}
			project={project}
			onClose={vi.fn()}
			onSubmit={onSubmit}
		/>
	);
	expect(
		screen.getByRole("dialog", { name: "Apply Wardrobe to Units" })
	).toBeVisible();
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will add 3 Items; 2 Units already hold it."
	);
	await user.selectOptions(screen.getByLabelText("Block"), "a");
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will add 1 Item; 2 Units already hold it."
	);
	await user.click(screen.getByRole("checkbox", { name: "BP2" }));
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will add 1 Item; 1 Unit already holds it."
	);
	await user.click(screen.getByRole("button", { name: "Apply" }));
	expect(onSubmit).toHaveBeenCalledWith({
		blockIds: ["a"],
		unitTypeIds: ["as1"],
	});
});
it("counts only Items made from this Catalogue Item and refuses to submit an emptied list", async () => {
	const user = userEvent.setup();
	const sink = { id: "sink", name: "Sink", itemCount: 1 };
	// u1 also holds a Sink; a Wardrobe preview must not count it.
	const twoItems: Project = {
		...project,
		catalogueItems: [...project.catalogueItems, sink],
		blocks: project.blocks.map((block) => ({
			...block,
			storeys: block.storeys.map((storey) => ({
				...storey,
				units: storey.units.map((unit) =>
					unit.id === "u1"
						? {
								...unit,
								itemCount: 2,
								items: [
									{
										catalogueItemId: "sink",
										subcontractorId: null,
										entryCount: 0,
									},
									{
										catalogueItemId: "wardrobe",
										subcontractorId: null,
										entryCount: 0,
									},
								],
							}
						: unit
				),
			})),
		})),
	};
	render(
		<ApplyCatalogueItemDialog
			catalogueItem={sink}
			project={twoItems}
			onClose={vi.fn()}
			onSubmit={vi.fn()}
		/>
	);
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will add 4 Items; 1 Unit already holds it."
	);
	await user.click(screen.getByRole("checkbox", { name: "A · 02" }));
	await user.click(screen.getByRole("checkbox", { name: "B · 01" }));
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will add 1 Item; 1 Unit already holds it."
	);
	await user.click(screen.getByLabelText("Select all Unit Types"));
	expect(screen.getByRole("status")).toHaveTextContent(
		"Will add 0 Items; 0 Units already hold it."
	);
	expect(screen.getByRole("button", { name: "Apply" })).toBeDisabled();
});
it("shows busy while the apply runs, the failure when it is refused, then the result and closes", async () => {
	const user = userEvent.setup();
	const onClose = vi.fn();
	let settle: (result: { added: number; skipped: number }) => void = () => {};
	const onSubmit = vi
		.fn<() => Promise<{ added: number; skipped: number }>>()
		.mockImplementationOnce(
			() =>
				new Promise((resolve) => {
					settle = resolve;
				})
		)
		.mockRejectedValueOnce(new Error("Boom"))
		.mockResolvedValueOnce({ added: 3, skipped: 2 });
	render(
		<ApplyCatalogueItemDialog
			catalogueItem={wardrobe}
			project={project}
			onClose={onClose}
			onSubmit={onSubmit}
		/>
	);
	const apply = screen.getByRole("button", { name: "Apply" });
	await user.click(apply);
	expect(apply).toHaveAttribute("aria-busy", "true");
	expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
	expect(screen.getByLabelText("Block")).toBeDisabled();
	settle({ added: 0, skipped: 0 });
	await waitFor(() => {
		expect(screen.getByRole("status")).toHaveTextContent("Added 0 Items");
	});
	await user.click(screen.getByRole("button", { name: "Close" }));
	expect(onClose).toHaveBeenCalledOnce();
	cleanup();
	render(
		<ApplyCatalogueItemDialog
			catalogueItem={wardrobe}
			project={project}
			onClose={onClose}
			onSubmit={onSubmit}
		/>
	);
	await user.click(screen.getByRole("button", { name: "Apply" }));
	expect(await screen.findByRole("alert")).toHaveTextContent(
		"Could not apply the Catalogue Item. Try again."
	);
	expect(screen.getByLabelText("Block")).toBeEnabled();
	await user.click(screen.getByRole("button", { name: "Apply" }));
	expect(await screen.findByRole("status")).toHaveTextContent(
		"Added 3 Items; skipped 2 Units already holding it."
	);
	expect(screen.queryByRole("alert")).toBeNull();
	expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
	expect(screen.getByLabelText("Block")).toBeDisabled();
	expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
	await user.click(screen.getByRole("button", { name: "Close" }));
	expect(onClose).toHaveBeenCalledTimes(2);
});
