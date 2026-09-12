import type { Meta, StoryObj } from "@storybook/react-vite";
import { StoreysPane } from "@/features/projects/StoreysPane";
const meta = {
	title: "Projects/StoreysPane",
	component: StoreysPane,
	args: {
		block: {
			id: "a",
			name: "A",
			position: 0,
			storeys: [{ id: "s", name: "01", position: 0, units: [] }],
		},
		selectedId: "s",
		onSelect: (): void => undefined,
		onAdd: (): Promise<void> => Promise.resolve(),
		onRename: (): Promise<void> => Promise.resolve(),
		onDelete: (): Promise<void> => Promise.resolve(),
	},
} satisfies Meta<typeof StoreysPane>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { block: undefined } };
