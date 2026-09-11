import type { Meta, StoryObj } from "@storybook/react-vite";
import { RenameSubcontractorForm } from "./RenameSubcontractorForm";
import type { RenameSubcontractorFailure } from "./formSchemas";
const meta = {
	title: "Subcontractors/RenameSubcontractorForm",
	component: RenameSubcontractorForm,
	args: {
		name: "Acme Fitout",
		onCancel: (): void => undefined,
		onSubmit: (): Promise<RenameSubcontractorFailure | void> =>
			Promise.resolve(),
	},
} satisfies Meta<typeof RenameSubcontractorForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Pending: Story = { args: { pending: true } };
export const NameTaken: Story = {
	args: {
		onSubmit: (): Promise<RenameSubcontractorFailure> =>
			Promise.resolve({
				field: "name",
				message: "A subcontractor with this name already exists.",
			}),
	},
};
export const ServerFailure: Story = {
	args: {
		onSubmit: (): Promise<RenameSubcontractorFailure> =>
			Promise.resolve({
				message: "Could not rename the subcontractor. Please try again.",
			}),
	},
};
