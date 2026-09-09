import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "@/components/ui/Button";
import { Page } from "@/components/layout/Page";
import { PageHeader } from "@/components/layout/PageHeader";
import { AccountBlock, NavItem, Sidebar } from "@/components/layout/Sidebar";
import { ConsoleShell } from "./ConsoleShell";

const meta = {
	title: "Layout/ConsoleShell",
	component: ConsoleShell,
	parameters: { layout: "fullscreen" },
	args: {
		closeMenuLabel: "Close menu",
		openMenuLabel: "Menu",
		sidebarLabel: "Sidebar",
		sidebar: (
			<Sidebar
				label="Console navigation"
				subtitle="Unit Matrix"
				foot={
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
					</>
				}
				navigation={
					<>
						<NavItem aria-current="page" href="#">
							Projects
						</NavItem>
						<NavItem href="#">Subcontractors</NavItem>
					</>
				}
			/>
		),
		children: (
			<Page>
				<PageHeader heading="Projects" kicker="Portfolio" />
				<div className="h-[120vh] border border-rule p-6">
					Tall content, to show the sidebar staying put while it scrolls.
				</div>
			</Page>
		),
	},
} satisfies Meta<typeof ConsoleShell>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};
export const Phone: Story = {
	globals: { viewport: { value: "mobile1", isRotated: false } },
};
