import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import {
	RemoveCatalogueItemDialog,
	type RemoveResult,
} from "@/features/projects/RemoveCatalogueItemDialog";
import type { Project } from "@/features/projects/types";
const rollup = { itemCount: 0, entryCount: 0, progression: null, items: [] };
const held = {
	itemCount: 1,
	entryCount: 2,
	progression: 40,
	items: [
		{ catalogueItemId: "wardrobe", subcontractorId: null, entryCount: 2 },
	],
};
const project: Project = {
	id: "gardens",
	name: "Gardens",
	code: "EG2",
	itemCount: 2,
	entryCount: 4,
	progression: 40,
	blocks: [
		{
			id: "a",
			name: "A",
			position: 0,
			itemCount: 2,
			entryCount: 4,
			progression: 40,
			storeys: [
				{
					id: "a1",
					name: "01",
					position: 0,
					itemCount: 2,
					entryCount: 4,
					progression: 40,
					units: [
						{ id: "u1", name: "01", position: 0, unitTypeId: "as1", ...held },
						{ id: "u2", name: "02", position: 1, unitTypeId: "bp2", ...held },
					],
				},
				{
					id: "a2",
					name: "02",
					position: 1,
					...rollup,
					units: [
						{ id: "u3", name: "01", position: 0, unitTypeId: "as1", ...rollup },
					],
				},
			],
		},
		{
			id: "b",
			name: "B",
			position: 1,
			...rollup,
			storeys: [
				{
					id: "b1",
					name: "01",
					position: 0,
					...rollup,
					units: [
						{ id: "u4", name: "01", position: 0, unitTypeId: "bp2", ...rollup },
						{ id: "u5", name: "02", position: 1, unitTypeId: null, ...rollup },
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
const meta = {
	title: "Projects/RemoveCatalogueItemDialog",
	component: RemoveCatalogueItemDialog,
	args: {
		project,
		catalogueItem: project.catalogueItems[0]!,
		onSubmit: (): Promise<RemoveResult> =>
			Promise.resolve({ removed: 2, entriesRemoved: 4 }),
		onClose: (): void => {},
	},
} satisfies Meta<typeof RemoveCatalogueItemDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
/** The dialog renders in a portal, so the play function looks in the whole document. */
const remove = async ({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}): Promise<void> => {
	await userEvent.click(
		await within(canvasElement.ownerDocument.body).findByRole("button", {
			name: "Remove",
		})
	);
};
export const Default: Story = {};
export const Confirming: Story = { args: { defaultConfirming: true } };
export const Busy: Story = {
	args: {
		defaultConfirming: true,
		onSubmit: (): Promise<RemoveResult> => new Promise(() => {}),
	},
	play: remove,
};
export const Failed: Story = {
	args: {
		defaultConfirming: true,
		onSubmit: (): Promise<RemoveResult> => Promise.reject(new Error()),
	},
	play: remove,
};
export const Removed: Story = {
	args: { defaultConfirming: true },
	play: remove,
};
