import type { Meta, StoryObj } from "@storybook/react-vite";
import { Logo } from "./Logo";

const meta = {
	title: "UI/Logo",
	component: Logo,
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {};
export const Large: Story = { args: { size: "large" } };
export const Reversed: Story = {
	args: { size: "large" },
	decorators: [
		(Story) => (
			<div className="bg-steel-900 p-8 text-white">
				<Story />
			</div>
		),
	],
};
