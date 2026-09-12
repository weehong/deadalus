import type { Meta, StoryObj } from "@storybook/react-vite";
import { ItemRow } from "@/features/projects/ItemRow";
import { ProgressEntryForm } from "@/components/progress/ProgressEntryForm";
import { ProgressHistory } from "@/components/progress/ProgressHistory";
const meta = {
	title: "Projects/ItemRow",
	component: ItemRow,
	args: {
		item: {
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
		},
		subcontractors: [
			{ id: "acme", name: "Acme Fitout" },
			{ id: "bolt", name: "Bolt Electrical" },
		],
		onAssign: (): void => {},
	},
} satisfies Meta<typeof ItemRow>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Assigned: Story = {};
export const Unassigned: Story = {
	args: {
		item: {
			id: "i2",
			catalogueItemId: "sink",
			name: "Sink",
			subcontractor: null,
			assignedAt: null,
			progression: 0,
			latestEntry: null,
		},
	},
};
export const Pending: Story = { args: { pending: true } };
/** As the Unit card composes it: the entry form and History beneath the row. */
export const WithProgress: Story = {
	render: (args) => (
		<ItemRow {...args}>
			<ProgressEntryForm
				itemName={args.item.name}
				onSubmit={async (): Promise<void> => {}}
			/>
			<ProgressHistory
				open
				itemName={args.item.name}
				entries={[
					{
						id: "e1",
						value: 45,
						note: "Doors hung",
						enteredByKind: "administrator",
						enteredByName: "administrator@example.com",
						subcontractorName: null,
						createdAt: "2026-09-10T12:00:00.000Z",
					},
				]}
				onToggle={(): void => {}}
			/>
		</ItemRow>
	),
};
