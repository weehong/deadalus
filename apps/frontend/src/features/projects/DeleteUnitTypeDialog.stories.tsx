import type { Meta, StoryObj } from "@storybook/react-vite";
import { DeleteUnitTypeDialog } from "@/features/projects/DeleteUnitTypeDialog";
const meta = {
	title: "Projects/DeleteUnitTypeDialog",
	component: DeleteUnitTypeDialog,
	args: {
		open: true,
		code: "BP2(p) (M)",
		pending: false,
		onCancel: (): void => {},
		onConfirm: (): void => {},
	},
} satisfies Meta<typeof DeleteUnitTypeDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Busy: Story = { args: { pending: true } };
