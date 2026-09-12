import type { Meta, StoryObj } from "@storybook/react-vite";
import { BatchNamesForm } from "@/features/projects/BatchNamesForm";
const meta = {
	title: "Projects/BatchNamesForm",
	component: BatchNamesForm,
	args: {
		existingNames: ["A", "01"],
		onSubmit: (): void => undefined,
		onCancel: (): void => undefined,
	},
} satisfies Meta<typeof BatchNamesForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Busy: Story = { args: { pending: true } };
export const ServerFailure: Story = {
	args: { error: "Names already exist: A, B" },
};
