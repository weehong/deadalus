import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnitCard } from "@/features/projects/UnitCard";
const meta = {
	title: "Projects/UnitCard",
	component: UnitCard,
	args: { name: "01", typeCode: "AS1" },
} satisfies Meta<typeof UnitCard>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Untyped: Story = { args: { typeCode: undefined } };
