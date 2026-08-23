import { BuildingOffice2Icon } from "@heroicons/react/24/outline";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarSection } from "./SidebarSection";

const props = {
	label: "Blueprints",
	path: "/blueprints/structure" as const,
	icon: BuildingOffice2Icon,
	children: [
		{ label: "Upload drawings", path: "/blueprints/upload" as const },
		{ label: "Building structure", path: "/blueprints/structure" as const },
	],
};
const SectionStory = () => {
	const root = createRootRoute();
	const route = createRoute({
		getParentRoute: () => root,
		path: "$",
		component: () => <SidebarSection {...props} />,
	});
	const router = createRouter({
		routeTree: root.addChildren([route]),
		history: createMemoryHistory({ initialEntries: ["/blueprints/structure"] }),
	});
	return (
		<div className="w-[236px] bg-steel-900 p-3">
			<RouterProvider router={router} />
		</div>
	);
};
const meta = {
	title: "Layout/Sidebar section",
	component: SectionStory,
} satisfies Meta<typeof SectionStory>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Expanded: Story = {};
