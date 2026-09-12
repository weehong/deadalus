import type { Meta, StoryObj } from "@storybook/react-vite";
import { DeleteProjectDialog } from "@/features/projects/DeleteProjectDialog";
const meta = {
	title: "Projects/DeleteProjectDialog",
	component: DeleteProjectDialog,
	args: {
		open: true,
		name: "Acme Fitout",
		blockCount: 2,
		storeyCount: 3,
		unitCount: 4,
		pending: false,
		error: false,
		onCancel: (): void => {},
		onConfirm: (): void => {},
	},
} satisfies Meta<typeof DeleteProjectDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Pending: Story = { args: { pending: true } };
export const Failed: Story = { args: { error: true } };
