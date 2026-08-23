import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
	title: "UI/Button",
	component: Button,
	args: { children: "Continue" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Icon: Story = {
	args: { "aria-label": "Add", children: "+", variant: "icon" },
};
export const FullWidth: Story = { args: { block: true } };
export const Framed: Story = { args: { framed: true } };
export const Pending: Story = { args: { pending: true } };
export const Disabled: Story = { args: { disabled: true } };
