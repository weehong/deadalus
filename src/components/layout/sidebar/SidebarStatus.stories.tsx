import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarStatus } from "./SidebarStatus";

const meta = {
	title: "Layout/Sidebar/Status",
	component: SidebarStatus,
	decorators: [
		(Story) => (
			<div className="w-59 bg-steel-900 text-canvas">
				<Story />
			</div>
		),
	],
	args: { syncTime: "14:32" },
} satisfies Meta<typeof SidebarStatus>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Impaired: Story = {
	args: { impairedServiceCount: 2 },
};
