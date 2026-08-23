import type { Meta, StoryObj } from "@storybook/react-vite";
import { Sidebar } from "./Sidebar";
import { ConsoleDrawer } from "./ConsoleDrawer";

const meta = {
	title: "Layout/Console drawer",
	component: ConsoleDrawer,
	args: {
		sidebar: <Sidebar items={[]} scope="All sites" />,
	},
	parameters: { viewport: { defaultViewport: "mobile1" } },
} satisfies Meta<typeof ConsoleDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Narrow: Story = {};
