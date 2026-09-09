import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/Button";
import { AccountBlock } from "./AccountBlock";

const meta = {
	title: "Layout/Sidebar/AccountBlock",
	component: AccountBlock,
	args: { email: "r.okonkwo@unitmatrix.co", role: "Administrator" },
	decorators: [
		(Story): React.ReactElement => (
			<div className="w-[216px] border border-rule p-4">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof AccountBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithSignOut: Story = {
	args: {
		action: (
			<Button
				aria-label="Sign out"
				className="size-8 min-h-8 flex-none p-0!"
				title="Sign out"
				variant="ghost"
			>
				<ArrowRightOnRectangleIcon aria-hidden="true" className="size-4" />
			</Button>
		),
	},
};
export const LongEmail: Story = {
	args: {
		...WithSignOut.args,
		email: "administrator.with.a.very.long.name@construction-company.example",
	},
};
