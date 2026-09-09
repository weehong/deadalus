import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/Button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { AccountBlock } from "./AccountBlock";
import { NavItem } from "./NavItem";
import { Sidebar } from "./Sidebar";

const meta = {
	title: "Layout/Sidebar",
	component: Sidebar,
	parameters: { layout: "fullscreen" },
	args: {
		label: "Console navigation",
		subtitle: "Unit Matrix",
		navigation: (
			<>
				<NavItem aria-current="page" href="#">
					Projects
				</NavItem>
				<NavItem href="#">Subcontractors</NavItem>
			</>
		),
		foot: (
			<>
				<AccountBlock
					email="r.okonkwo@unitmatrix.co"
					role="Administrator"
					action={
						<Button
							aria-label="Sign out"
							className="size-8 min-h-8 flex-none p-0!"
							title="Sign out"
							variant="ghost"
						>
							<ArrowRightOnRectangleIcon
								aria-hidden="true"
								className="size-4"
							/>
						</Button>
					}
				/>
				<div hidden>
					<LanguageSwitcher />
				</div>
			</>
		),
	},
	decorators: [
		(Story): React.ReactElement => (
			<div className="h-screen w-[216px] border-r border-rule">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
