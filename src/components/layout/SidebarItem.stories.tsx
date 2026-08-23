import { ClipboardDocumentListIcon } from "@heroicons/react/24/outline";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { SidebarItem, type SidebarItemProps } from "./SidebarItem";

const renderItem = (props: SidebarItemProps) => {
	const rootRoute = createRootRoute();
	const route = createRoute({
		getParentRoute: () => rootRoute,
		path: "$",
		component: () => <SidebarItem {...props} />,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([route]),
		history: createMemoryHistory({ initialEntries: [props.path] }),
	});
	return <RouterProvider router={router} />;
};

const meta = {
	title: "Layout/Sidebar item",
	component: SidebarItem,
	args: {
		label: "Work orders",
		path: "/work-orders",
		icon: ClipboardDocumentListIcon,
		count: 148,
	},
	decorators: [
		(Story) => (
			<div className="w-[236px] bg-steel-900 p-3">
				<Story />
			</div>
		),
	],
	render: (args) => renderItem(args),
} satisfies Meta<typeof SidebarItem>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Current: Story = {};
export const WithoutCount: Story = {
	args: { count: undefined, label: "Assets", path: "/assets" },
};
export const CappedCount: Story = { args: { count: 1_200 } };
