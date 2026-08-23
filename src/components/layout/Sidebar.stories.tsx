import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { consoleNavigation } from "@/features/console/navigation";
import { Sidebar, type SidebarProps } from "./Sidebar";

const items = consoleNavigation.map((item) => ({
	...item,
	label: item.labelKey,
	children: item.children?.map((child) => ({
		...child,
		label: child.labelKey,
	})),
}));
const renderSidebar = (props: SidebarProps) => {
	const rootRoute = createRootRoute();
	const route = createRoute({
		getParentRoute: () => rootRoute,
		path: "$",
		component: () => <Sidebar {...props} />,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([route]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	return <RouterProvider router={router} />;
};

const meta = {
	title: "Layout/Sidebar",
	component: Sidebar,
	args: { items, scope: "All sites" },
	parameters: { layout: "fullscreen" },
	render: (args) => renderSidebar(args),
} satisfies Meta<typeof Sidebar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
