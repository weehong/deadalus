import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "@/components/ui/Input";
import { Field } from "./Field";

const meta = {
	title: "UI/Field",
	component: Field,
	args: {
		id: "email",
		label: "Work email",
		children: <Input placeholder="name@company.com" />,
	},
} satisfies Meta<typeof Field>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithError: Story = { args: { error: "Work email is required" } };
