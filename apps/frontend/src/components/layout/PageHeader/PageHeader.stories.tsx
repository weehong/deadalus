import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "./PageHeader";

const meta = {
	title: "Layout/PageHeader",
	component: PageHeader,
	args: { heading: "Projects", kicker: "Portfolio" },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithActions: Story = {
	args: {
		actions: (
			<>
				<Button variant="secondary">Print QR labels</Button>
				<Button>New project</Button>
			</>
		),
	},
};
export const HeadingOnly: Story = { args: { kicker: undefined } };
