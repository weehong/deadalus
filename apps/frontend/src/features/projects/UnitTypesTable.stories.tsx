import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnitTypesTable } from "@/features/projects/UnitTypesTable";
const meta = {
	title: "Projects/UnitTypesTable",
	component: UnitTypesTable,
	args: {
		unitTypes: [
			{ id: "as1", code: "AS1", description: "1 Bedroom", unitCount: 8 },
		],
	},
} satisfies Meta<typeof UnitTypesTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Empty: Story = { args: { unitTypes: [] } };
