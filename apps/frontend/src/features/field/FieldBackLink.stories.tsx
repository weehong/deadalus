import { withRouter } from "@/testing/withRouter";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldBackLink } from "@/features/field/FieldBackLink";

const meta = {
	title: "Field/FieldBackLink",
	component: FieldBackLink,
	decorators: [(Story): React.ReactElement => withRouter(<Story />)],
	parameters: {
		layout: "padded",
		viewport: { defaultViewport: "mobile1" },
	},
	args: {
		label: "Back to Projects",
		target: { to: "projects" },
	},
} satisfies Meta<typeof FieldBackLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ToProjects: Story = {};

/** Back up the drill-down: to the Storeys of the selected Block. */
export const ToStoreys: Story = {
	args: {
		label: "Back to Storeys",
		target: { to: "project", id: "gardens", search: { block: "a" } },
	},
};
