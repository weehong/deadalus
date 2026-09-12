import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressHistory } from "./ProgressHistory";
const entries = [
	{
		id: "e2",
		value: 60,
		note: null,
		enteredByKind: "member" as const,
		enteredByName: "Alex",
		subcontractorName: "Acme Fitout",
		createdAt: "2026-09-09T12:00:00.000Z",
	},
	{
		id: "e1",
		value: 20,
		note: "Carcass in",
		enteredByKind: "administrator" as const,
		enteredByName: "administrator@example.com",
		subcontractorName: null,
		createdAt: "2026-09-08T12:00:00.000Z",
	},
];
const meta = {
	title: "Progress/ProgressHistory",
	component: ProgressHistory,
	args: {
		itemName: "Sink",
		open: true,
		entries,
		onToggle: (): void => {},
		onRetry: (): void => {},
	},
} satisfies Meta<typeof ProgressHistory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Open: Story = {};
export const Closed: Story = { args: { open: false } };
export const Loading: Story = { args: { entries: undefined, loading: true } };
export const Empty: Story = { args: { entries: [] } };
export const Failed: Story = {
	args: {
		entries: undefined,
		error: "Could not load the history. Try again.",
	},
};
