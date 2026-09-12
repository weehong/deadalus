import type { Meta, StoryObj } from "@storybook/react-vite";
import { LatestEntryLine } from "./LatestEntryLine";

const meta = {
	title: "Progress/LatestEntryLine",
	component: LatestEntryLine,
	args: {
		latest: {
			value: 45,
			note: "Doors hung",
			enteredByName: "Alex Tan",
			createdAt: "2026-09-10T12:00:00.000Z",
		},
	},
} satisfies Meta<typeof LatestEntryLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithLatestEntry: Story = {};
export const NoEntries: Story = { args: { latest: null } };
