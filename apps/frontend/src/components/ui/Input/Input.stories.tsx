import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./Input";

const meta = {
	title: "UI/Input",
	component: Input,
	args: { placeholder: "name@company.com", "aria-label": "Work email" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Invalid: Story = {
	args: { "aria-invalid": true, value: "not-an-email" },
};
