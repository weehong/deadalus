import type { Meta, StoryObj } from "@storybook/react-vite";
import { UnitItemsDisclosure } from "@/features/projects/UnitItemsDisclosure";
const items = [
	{
		id: "i1",
		catalogueItemId: "sink",
		name: "Sink",
		subcontractor: null,
		assignedAt: null,
		progression: 0,
		latestEntry: null,
	},
	{
		id: "i2",
		catalogueItemId: "wardrobe",
		name: "Wardrobe",
		subcontractor: { id: "acme", name: "Acme Fitout" },
		assignedAt: "2026-09-01T00:00:00.000Z",
		progression: 45,
		latestEntry: {
			value: 45,
			note: null,
			enteredByName: "administrator@example.com",
			createdAt: "2026-09-10T12:00:00.000Z",
		},
	},
];
const meta = {
	title: "Projects/UnitItemsDisclosure",
	component: UnitItemsDisclosure,
	args: {
		open: true,
		items,
		subcontractors: [
			{ id: "acme", name: "Acme Fitout" },
			{ id: "bolt", name: "Bolt Electrical" },
		],
		onToggle: (): void => {},
		onRetry: (): void => {},
		onAssign: (): void => {},
	},
} satisfies Meta<typeof UnitItemsDisclosure>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Open: Story = {};
export const Closed: Story = { args: { open: false } };
export const Loading: Story = { args: { items: undefined, loading: true } };
export const Empty: Story = { args: { items: [] } };
export const Failed: Story = {
	args: { items: undefined, error: "Could not load the Items. Try again." },
};
export const Assigning: Story = { args: { pendingItemId: "i2" } };
export const AssignFailed: Story = {
	args: { assignError: "Could not change the Assignment. Try again." },
};
