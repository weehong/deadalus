import type { Meta, StoryObj } from "@storybook/react-vite";
import { NavItem } from "./NavItem";

const meta = {
	title: "Layout/Sidebar/NavItem",
	component: NavItem,
	args: { children: "Projects", href: "#" },
	decorators: [
		(Story): React.ReactElement => (
			<div className="w-[216px] border border-rule py-2">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof NavItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { "aria-current": "page" } };
