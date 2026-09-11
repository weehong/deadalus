import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreateSubcontractorForm } from "./CreateSubcontractorForm";
import type { CreateSubcontractorFailure } from "./formSchemas";

const meta = {
	title: "Subcontractors/CreateSubcontractorForm",
	component: CreateSubcontractorForm,
	args: {
		onCancel: (): void => undefined,
		onSubmit: (): Promise<CreateSubcontractorFailure | void> =>
			Promise.resolve(),
	},
} satisfies Meta<typeof CreateSubcontractorForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Pending: Story = { args: { pending: true } };
export const ServerFailure: Story = {
	args: {
		onSubmit: (): Promise<CreateSubcontractorFailure> =>
			Promise.resolve({
				message: "Could not create the subcontractor. Please try again.",
			}),
	},
};
export const PhoneTaken: Story = {
	args: {
		onSubmit: (): Promise<CreateSubcontractorFailure> =>
			Promise.resolve({
				field: "member.phone",
				message: "This phone number belongs to a Member of Acme Fitout.",
			}),
	},
};
