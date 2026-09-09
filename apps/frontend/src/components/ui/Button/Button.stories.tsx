import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
	title: "UI/Button",
	component: Button,
	args: { children: "Enter portal" },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Framed: Story = { args: { framed: true } };
export const Block: Story = { args: { block: true, framed: true } };
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Pending: Story = {
	args: { pending: true, children: "Signing in…" },
};
export const Disabled: Story = { args: { disabled: true } };
