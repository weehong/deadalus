import type { Meta, StoryObj } from "@storybook/react-vite";
import { Page } from "./Page";

const meta = {
	title: "Layout/Page",
	component: Page,
	parameters: { layout: "fullscreen" },
	args: {
		children: <div className="border border-rule p-10">Page content</div>,
	},
} satisfies Meta<typeof Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
