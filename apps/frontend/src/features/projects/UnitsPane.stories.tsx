import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnitsPane } from "@/features/projects/UnitsPane";
const storey = {
	id: "s",
	name: "01",
	position: 0,
	itemCount: 0,
	entryCount: 0,
	progression: null,
	units: [
		{
			id: "u",
			name: "01",
			position: 0,
			itemCount: 0,
			entryCount: 0,
			progression: null,
			unitTypeId: "t",
			items: [],
		},
		{
			id: "v",
			name: "02",
			position: 1,
			itemCount: 0,
			entryCount: 0,
			progression: null,
			unitTypeId: null,
			items: [],
		},
	],
};
const meta = {
	title: "Projects/UnitsPane",
	component: UnitsPane,
	args: {
		block: {
			id: "b",
			name: "A",
			position: 0,
			itemCount: 0,
			entryCount: 0,
			progression: null,
			storeys: [storey],
		},
		storey,
		unitTypes: [{ id: "t", code: "AS1", description: null, unitCount: 1 }],
		onAdd: (): Promise<void> => Promise.resolve(),
		onEdit: (): Promise<void> => Promise.resolve(),
		onDelete: (): Promise<void> => Promise.resolve(),
	},
} satisfies Meta<typeof UnitsPane>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Busy: Story = { args: { pending: true } };
export const NoStorey: Story = { args: { storey: undefined } };
