import type { Meta, StoryObj } from "@storybook/react-vite";
import { DeleteSubcontractorDialog } from "./DeleteSubcontractorDialog";
const meta = {
	title: "Subcontractors/DeleteSubcontractorDialog",
	component: DeleteSubcontractorDialog,
	args: {
		open: true,
		name: "Acme Fitout",
		memberCount: 2,
		pending: false,
		error: false,
		onCancel: (): void => {},
		onConfirm: (): void => {},
	},
} satisfies Meta<typeof DeleteSubcontractorDialog>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Pending: Story = { args: { pending: true } };
export const Failed: Story = { args: { error: true } };
