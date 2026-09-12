import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldHeader } from "@/features/field/FieldHeader";

const meta = {
	title: "Field/FieldHeader",
	component: FieldHeader,
	parameters: {
		layout: "fullscreen",
		viewport: { defaultViewport: "mobile1" },
	},
	args: {
		memberName: "Alex Tan",
		subcontractorName: "Acme Joinery",
		onSignOut: (): void => undefined,
	},
} satisfies Meta<typeof FieldHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LongNames: Story = {
	args: {
		memberName: "A Member With An Unusually Long Registered Name",
		subcontractorName: "Acme Joinery and Interior Fitout Specialists Pte Ltd",
	},
};
