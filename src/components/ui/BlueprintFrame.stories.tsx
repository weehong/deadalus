import type { Meta, StoryObj } from "@storybook/react-vite";
import { BlueprintFrame } from "./BlueprintFrame";

const meta = {
	title: "UI/BlueprintFrame",
	component: BlueprintFrame,
	args: { children: "Blueprint content", className: "m-4 p-8" },
} satisfies Meta<typeof BlueprintFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const AsSection: Story = { args: { as: "section" } };
