import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ProgressEntry } from "@/common/items";
import {
	ProgressEntryPanel,
	type ProgressHistoryRead,
} from "./ProgressEntryPanel";

const entries: Array<ProgressEntry> = [
	{
		id: "e2",
		value: 60,
		note: null,
		enteredByKind: "member",
		enteredByName: "Alex Tan",
		subcontractorName: "Acme Joinery",
		createdAt: "2026-09-09T12:00:00.000Z",
	},
	{
		id: "e1",
		value: 20,
		note: "Carcass in",
		enteredByKind: "administrator",
		enteredByName: "administrator@example.com",
		subcontractorName: null,
		createdAt: "2026-09-08T12:00:00.000Z",
	},
];

const readHistory =
	(
		read: ProgressHistoryRead
	): ((itemId: string, enabled: boolean) => ProgressHistoryRead) =>
	(_itemId, enabled): ProgressHistoryRead =>
		enabled
			? read
			: { isLoading: false, isError: false, refetch: (): void => {} };

const meta = {
	title: "Progress/ProgressEntryPanel",
	component: ProgressEntryPanel,
	args: {
		item: {
			id: "i1",
			catalogueItemId: "wardrobe",
			name: "Wardrobe",
			subcontractor: { id: "acme", name: "Acme Joinery" },
			assignedAt: "2026-09-01T00:00:00.000Z",
			progression: 60,
			latestEntry: {
				value: 60,
				note: null,
				enteredByName: "Alex Tan",
				createdAt: "2026-09-09T12:00:00.000Z",
			},
		},
		useHistory: readHistory({
			data: entries,
			isLoading: false,
			isError: false,
			refetch: (): void => {},
		}),
		onEnter: (): Promise<void> => Promise.resolve(),
	},
} satisfies Meta<typeof ProgressEntryPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** As the Console's Unit card shows it; open History to read the entries. */
export const Console: Story = {};

/** As the Field's Unit screen shows it: every control sized for a thumb. */
export const Field: Story = {
	parameters: { viewport: { defaultViewport: "mobile1" } },
	args: { controlClassName: "h-[44px] text-base", buttonClassName: "h-[44px]" },
};

/** An Item with no Assignment accepts no entry. */
export const Unassigned: Story = {
	args: {
		item: {
			id: "i2",
			catalogueItemId: "sink",
			name: "Sink",
			subcontractor: null,
			assignedAt: null,
			progression: 0,
			latestEntry: null,
		},
		useHistory: readHistory({
			data: [],
			isLoading: false,
			isError: false,
			refetch: (): void => {},
		}),
	},
};

export const Pending: Story = { args: { pending: true } };

/** The history could not be read; Retry reads it again. */
export const HistoryFailed: Story = {
	args: {
		useHistory: readHistory({
			isLoading: false,
			isError: true,
			refetch: (): void => {},
		}),
	},
};
