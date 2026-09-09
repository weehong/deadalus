import type { Meta, StoryObj } from "@storybook/react-vite";
import { BootLoadingState } from "./LoadingState";

const meta = {
	title: "UI/BootLoadingState",
	component: BootLoadingState,
	parameters: { layout: "fullscreen" },
} satisfies Meta<typeof BootLoadingState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
