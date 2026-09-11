import type { Meta, StoryObj } from "@storybook/react-vite";
import { MemberRowForm } from "./MemberRowForm";
import type { MemberFailure } from "./formSchemas";
const meta = {
	title: "Subcontractors/MemberRowForm",
	component: MemberRowForm,
	args: {
		onCancel: (): void => undefined,
		onSubmit: (): Promise<MemberFailure | void> => Promise.resolve(),
	},
} satisfies Meta<typeof MemberRowForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Add: Story = {};
export const Edit: Story = {
	args: { member: { name: "Alex", phone: "+6591234567" } },
};
export const Pending: Story = { args: { pending: true } };
export const PhoneTaken: Story = {
	args: {
		onSubmit: (): Promise<MemberFailure> =>
			Promise.resolve({
				field: "phone",
				message: "This phone number belongs to a Member of Beacon.",
			}),
	},
};
export const ServerFailure: Story = {
	args: {
		onSubmit: (): Promise<MemberFailure> =>
			Promise.resolve({
				message: "Could not save the Member. Please try again.",
			}),
	},
};
