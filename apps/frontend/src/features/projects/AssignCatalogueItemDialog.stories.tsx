import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within } from "storybook/test";
import {
	AssignCatalogueItemDialog,
	type AssignResult,
} from "@/features/projects/AssignCatalogueItemDialog";
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
	catalogueItems: [{ id: "wardrobe", name: "Wardrobe", itemCount: 5 }],
};
const meta = {
	title: "Projects/AssignCatalogueItemDialog",
	component: AssignCatalogueItemDialog,
	args: {
		project,
		catalogueItem: project.catalogueItems[0]!,
		subcontractors: [
			{ id: "acme", name: "Acme Fitout" },
			{ id: "bolt", name: "Bolt Electrical" },
		],
		onSearch: (): void => {},
		onSubmit: (): Promise<AssignResult> =>
			Promise.resolve({ assigned: 3, skipped: 2 }),
		onClose: (): void => {},
	},
} satisfies Meta<typeof AssignCatalogueItemDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
/** The dialog renders in a portal, so the play function looks in the whole document. */
const assignToAcme = async ({
	canvasElement,
}: {
	canvasElement: HTMLElement;
}): Promise<void> => {
	const body = within(canvasElement.ownerDocument.body);
	await userEvent.selectOptions(
		await body.findByLabelText("Subcontractor"),
		"acme"
	);
	await userEvent.click(body.getByRole("button", { name: "Assign" }));
};
export const Default: Story = {};
export const Searching: Story = {
	args: { searching: true, subcontractors: [] },
};
export const Busy: Story = {
	args: { onSubmit: (): Promise<AssignResult> => new Promise(() => {}) },
	play: assignToAcme,
};
export const Failed: Story = {
	args: { onSubmit: (): Promise<AssignResult> => Promise.reject(new Error()) },
	play: assignToAcme,
};
export const Assigned: Story = { play: assignToAcme };
