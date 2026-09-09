import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoginForm } from "./LoginForm";

const meta = {
	title: "Auth/LoginForm",
	component: LoginForm,
	args: { onSubmit: (): void => undefined },
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Pending: Story = { args: { pending: true } };
export const Rejected: Story = {
	args: { error: "The email or password is incorrect." },
};
