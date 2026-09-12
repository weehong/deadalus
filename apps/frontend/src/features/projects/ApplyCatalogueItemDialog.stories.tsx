import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import {
	ApplyCatalogueItemDialog,
	type ApplyResult,
} from "@/features/projects/ApplyCatalogueItemDialog";
import type { Project } from "@/features/projects/types";
const rollup = { itemCount: 0, entryCount: 0, progression: null, items: [] };
const held = {
	itemCount: 1,
	entryCount: 0,
	progression: 0,
	items: [
		{ catalogueItemId: "wardrobe", subcontractorId: null, entryCount: 0 },
	],
};
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
	title: "Projects/ApplyCatalogueItemDialog",
	component: ApplyCatalogueItemDialog,
	args: {
		project,
		catalogueItem: project.catalogueItems[0]!,
		onSubmit: (): Promise<ApplyResult> =>
			Promise.resolve({ added: 3, skipped: 2 }),
		onClose: (): void => {},
	},
} satisfies Meta<typeof ApplyCatalogueItemDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
/** The dialog renders in a portal, so the play function looks in the whole document. */
const apply = async ({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}): Promise<void> => {
	await userEvent.click(
		await within(canvasElement.ownerDocument.body).findByRole("button", {
			name: "Apply",
		})
	);
};
export const Default: Story = {};
export const Busy: Story = {
	args: { onSubmit: (): Promise<ApplyResult> => new Promise(() => {}) },
	play: apply,
};
export const Failed: Story = {
	args: { onSubmit: (): Promise<ApplyResult> => Promise.reject(new Error()) },
	play: apply,
};
export const Applied: Story = { play: apply };
