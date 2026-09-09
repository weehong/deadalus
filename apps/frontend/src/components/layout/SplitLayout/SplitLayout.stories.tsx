import type { Meta, StoryObj } from "@storybook/react-vite";
import { SplitLayout } from "./SplitLayout";

const meta = {
	title: "Layout/SplitLayout",
	component: SplitLayout,
	parameters: { layout: "fullscreen" },
	args: {
		aside: <div className="h-full bg-accent-900 p-10 text-canvas">Aside</div>,
		children: <div className="border border-rule p-10">Content</div>,
	},
} satisfies Meta<typeof SplitLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
