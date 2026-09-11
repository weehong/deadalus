import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MembersTable } from "./MembersTable";
const meta = {
	title: "Subcontractors/MembersTable",
	component: MembersTable,
	args: {
		onRemove: fn(),
		members: [
			{ id: "alex", name: "Alex Tan", phone: "+6591234567" },
			{ id: "mei", name: "Mei Lim", phone: "+6592345678" },
		],
	},
} satisfies Meta<typeof MembersTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongName: Story = {
	args: {
		members: [
			{
				id: "long",
				name: "MemberWithAVeryLongUnbrokenDisplayName",
				phone: "+6591234567",
			},
		],
	},
};

export const Removing: Story = { args: { removingMemberId: "alex" } };
