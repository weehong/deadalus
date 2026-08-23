import type { Meta, StoryObj } from "@storybook/react-vite";
import { SignInForm } from "./SignInForm";

const meta = { title: "Authentication/Sign-in form", component: SignInForm, args: { onSubmit: async () => { await Promise.resolve(); } }, decorators: [(Story) => <div className="max-w-md bg-surface p-8"><Story /></div>] } satisfies Meta<typeof SignInForm>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Empty: Story = {};
export const Invalid: Story = { args: { error: "Enter a valid email address" } };
export const Pending: Story = { args: { pending: true } };
export const Failed: Story = { args: { error: "The email or password is incorrect." } };
