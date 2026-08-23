import { render, screen } from "@testing-library/react";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { Squares2X2Icon } from "@heroicons/react/24/outline";
import { describe, expect, it } from "vitest";
import { SidebarItem, type SidebarItemProps } from "./SidebarItem";

const mount = async (path: string, props: SidebarItemProps) => {
	const rootRoute = createRootRoute({ component: Outlet });
	const itemRoute = createRoute({
		getParentRoute: () => rootRoute,
		path: "$",
		component: () => <SidebarItem {...props} />,
	});
	const router = createRouter({
		routeTree: rootRoute.addChildren([itemRoute]),
		history: createMemoryHistory({ initialEntries: [path] }),
	});
	render(<RouterProvider router={router} />);
	await router.load();
};

const baseProps: SidebarItemProps = {
	label: "Overview",
	path: "/",
	icon: Squares2X2Icon,
};

describe("SidebarItem", () => {
	it("renders its icon and label without inventing a count", async () => {
		await mount("/", baseProps);
		const link = await screen.findByRole("link", { name: "Overview" });
		expect(link.querySelector("svg")).toBeTruthy();
		expect(link.textContent).toContain("Overview");
	});

	it("includes a capped count in its accessible name", async () => {
		await mount("/work-orders", {
			...baseProps,
			label: "Work orders",
			path: "/work-orders",
			count: 1_000,
		});
		expect(
			(await screen.findByRole("link", { name: "Work orders, 999+" }))
				.textContent
		).toContain("999+");
	});

	it("marks a prefix match as current", async () => {
		await mount("/work-orders/42", {
			...baseProps,
			label: "Work orders",
			path: "/work-orders",
		});
		expect(
			await screen.findByRole("link", { name: "Work orders", current: "page" })
		).toBeTruthy();
	});

	it("does not mark an exact item on a nested path as current", async () => {
		await mount("/work-orders/42", { ...baseProps, exact: true });
		expect(
			(await screen.findByRole("link", { name: "Overview" })).hasAttribute(
				"aria-current"
			)
		).toBe(false);
	});
});
