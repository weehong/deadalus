import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldSignInForm } from "@/features/field/FieldSignInForm";

const meta = {
	title: "Field/FieldSignInForm",
	component: FieldSignInForm,
	parameters: { viewport: { defaultViewport: "mobile1" } },
	args: { onSubmit: (): void => undefined },
} satisfies Meta<typeof FieldSignInForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Pending: Story = { args: { pending: true } };
export const NotRegistered: Story = {
	args: { error: "That phone number is not registered" },
};
