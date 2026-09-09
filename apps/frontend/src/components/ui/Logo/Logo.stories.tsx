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
	args: { size: "large", className: "text-canvas" },
	decorators: [
		(Story: React.ComponentType): React.ReactElement => (
			<div className="bg-accent-900 p-6">
				<Story />
			</div>
		),
	],
};
