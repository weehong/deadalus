import { render, screen, within } from "@testing-library/react";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { CubeIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import { describe, expect, it } from "vitest";
import { Sidebar, type SidebarProps } from "./Sidebar";

const items: SidebarProps["items"] = [
	{ label: "Overview", path: "/", icon: Squares2X2Icon, exact: true },
	{ label: "Assets", path: "/assets", icon: CubeIcon },
];

const mount = async (props: Partial<SidebarProps> = {}) => {
	const rootRoute = createRootRoute({ component: Outlet });
	const route = createRoute({
		getParentRoute: () => rootRoute,
		path: "$",
		component: () => <Sidebar items={items} scope="All sites" {...props} />,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([route]),
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	render(<RouterProvider router={router} />);
	await router.load();
};

describe("Sidebar", () => {
	it("renders its identity, scope and supplied destinations in order", async () => {
		await mount();
		expect(await screen.findByLabelText("Daedalus Ops")).toBeTruthy();
		expect(screen.getByText("All sites")).toBeTruthy();
		const links = within(
			screen.getByRole("navigation", { name: "Primary" })
		).getAllByRole("link");
		expect(links.map((link) => link.textContent)).toEqual([
			"Overview",
			"Assets",
		]);
	});

	it("renders status content supplied by its consumer", async () => {
		await mount({ status: <p>Last sync 09:42</p> });
		expect(await screen.findByText("Last sync 09:42")).toBeTruthy();
	});
});
