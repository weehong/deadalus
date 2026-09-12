import type { Meta, StoryObj } from "@storybook/react-vite";
import { StructurePane } from "@/features/projects/StructurePane";
const meta = {
	title: "Projects/StructurePane",
	component: StructurePane,
	args: {
		heading: "Blocks",
		emptyMessage: "Add your first Block.",
		rows: [
			{ id: "a", name: "A", detail: "2 storeys · 8 units" },
			{ id: "b", name: "B", detail: "0 storeys · 0 units" },
		],
		selectedId: "a",
		onSelect: (): void => {},
	},
} satisfies Meta<typeof StructurePane>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { rows: [] } };
