import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressEntryForm } from "@/components/progress/ProgressEntryForm";
import { ProgressHistory } from "@/components/progress/ProgressHistory";
import { FieldItemRow } from "@/features/field/FieldItemRow";

const meta = {
	title: "Field/FieldItemRow",
	component: FieldItemRow,
	parameters: {
		layout: "padded",
		viewport: { defaultViewport: "mobile1" },
	},
	args: {
		item: {
			id: "i1",
			catalogueItemId: "wardrobe",
			name: "Wardrobe",
			subcontractor: { id: "acme", name: "Acme Joinery" },
			assignedAt: "2026-09-01T00:00:00.000Z",
			progression: 45,
			latestEntry: {
				value: 45,
				note: "Doors hung",
				enteredByName: "Alex Tan",
				createdAt: "2026-09-10T12:00:00.000Z",
			},
		},
	},
} satisfies Meta<typeof FieldItemRow>;

export default meta;
type Story = StoryObj<typeof meta>;

/** An Item with a latest entry. */
export const WithLatestEntry: Story = {};

/** An Item no one has entered progress on yet. */
export const NoEntries: Story = {
	args: {
		item: {
			id: "i2",
			catalogueItemId: "sink",
			name: "Sink",
			subcontractor: { id: "acme", name: "Acme Joinery" },
			assignedAt: "2026-09-01T00:00:00.000Z",
			progression: 0,
			latestEntry: null,
		},
	},
};

/** As the Unit screen composes it: the entry form and History beneath the row. */
export const WithProgress: Story = {
	render: (args) => (
		<FieldItemRow {...args}>
			<ProgressEntryForm
				controlClassName="h-[44px] text-base"
				itemName={args.item.name}
				onSubmit={async (): Promise<void> => {}}
			/>
			<ProgressHistory
				open
				buttonClassName="h-[44px]"
				itemName={args.item.name}
				entries={[
					{
						id: "e1",
						value: 45,
						note: "Doors hung",
						enteredByKind: "member",
						enteredByName: "Alex Tan",
						subcontractorName: "Acme Joinery",
						createdAt: "2026-09-10T12:00:00.000Z",
					},
				]}
				onToggle={(): void => {}}
			/>
		</FieldItemRow>
	),
};
