import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnitMatrixTable } from "@/features/projects/UnitMatrixTable";
const meta = {
	title: "Projects/UnitMatrixTable",
	component: UnitMatrixTable,
	args: {
		block: {
			name: "West",
			stacks: ["01", "02"],
			storeys: [
				{ name: "01", cells: ["A1", "A2"] },
				{ name: "02", cells: ["PH", null] },
			],
			unitCount: 3,
			warnings: [],
		},
	},
} satisfies Meta<typeof UnitMatrixTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
