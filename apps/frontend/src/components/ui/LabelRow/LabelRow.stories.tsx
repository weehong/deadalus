import type { Meta, StoryObj } from "@storybook/react-vite";
import { LabelRow } from "./LabelRow";

const meta = {
	title: "UI/LabelRow",
	component: LabelRow,
	args: { labels: ["Projects", "Blocks", "Storeys", "Units"] },
} satisfies Meta<typeof LabelRow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Reversed: Story = {
	args: { className: "border-accent-700 text-accent-300" },
	decorators: [
		(Story: React.ComponentType): React.ReactElement => (
			<div className="bg-accent-900 p-6">
				<Story />
			</div>
		),
	],
};
