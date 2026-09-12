import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressionBadge } from "./ProgressionBadge";
const meta = {
	title: "Progress/ProgressionBadge",
	component: ProgressionBadge,
	args: { progression: 45.5 },
} satisfies Meta<typeof ProgressionBadge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const NothingDone: Story = { args: { progression: 0 } };
export const Complete: Story = { args: { progression: 100 } };
/** No Items beneath the node: blank, with "No Items" for assistive technology. */
export const NoItems: Story = { args: { progression: null } };
