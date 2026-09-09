import type { Meta, StoryObj } from "@storybook/react-vite";
import { BlueprintFrame } from "./BlueprintFrame";

const meta = {
	title: "UI/BlueprintFrame",
	component: BlueprintFrame,
	args: {
		className: "p-6",
		children: "A hairline box with four registration marks.",
	},
} satisfies Meta<typeof BlueprintFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AsSection: Story = {
	args: { as: "section", children: "Rendered as a <section>." },
};
