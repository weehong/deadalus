import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProgressEntryForm } from "./ProgressEntryForm";
import type { ProgressEntryFailure } from "@/common/progress-entry-failure";
const meta = {
	title: "Progress/ProgressEntryForm",
	component: ProgressEntryForm,
	args: {
		itemName: "Sink",
		onSubmit: async (): Promise<ProgressEntryFailure | void> => {},
	},
} satisfies Meta<typeof ProgressEntryForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Assigned: Story = {};
export const Unassigned: Story = {
	args: { itemName: "Wardrobe", unassigned: true },
};
export const Pending: Story = { args: { pending: true } };
/** As the Field shows it: every control 44px tall for a thumb. */
export const Thumb: Story = {
	parameters: { viewport: { defaultViewport: "mobile1" } },
	args: { controlClassName: "h-[44px] text-base" },
};
export const Refused: Story = {
	args: {
		onSubmit: (): Promise<ProgressEntryFailure> =>
			Promise.resolve({
				message: "This Item has no Assignment. Assign it first.",
			}),
	},
};
