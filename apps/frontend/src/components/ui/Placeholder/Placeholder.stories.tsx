import type { Meta, StoryObj } from "@storybook/react-vite";
import { Placeholder } from "./Placeholder";

const meta = {
	title: "UI/Placeholder",
	component: Placeholder,
	args: { children: "This screen is not built yet." },
} satisfies Meta<typeof Placeholder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
