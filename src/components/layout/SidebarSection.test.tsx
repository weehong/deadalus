import { BuildingOffice2Icon } from "@heroicons/react/24/outline";
import { render, screen } from "@testing-library/react";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { SidebarSection } from "./SidebarSection";

const children = [
	{ label: "Upload drawings", path: "/blueprints/upload" as const },
	{ label: "Building structure", path: "/blueprints/structure" as const },
];
const mount = async (path: string) => {
	const root = createRootRoute();
	const route = createRoute({
		getParentRoute: () => root,
		path: "$",
		component: () => (
			<SidebarSection
				children={children}
				icon={BuildingOffice2Icon}
				label="Blueprints"
				path="/blueprints/structure"
			/>
		),
	});
	const router = createRouter({
		routeTree: root.addChildren([route]),
		history: createMemoryHistory({ initialEntries: [path] }),
	});
	render(<RouterProvider router={router} />);
	await router.load();
};
describe("SidebarSection", () => {
	it("hides children outside its section", async () => {
		await mount("/assets");
		expect(
			screen
				.getByRole("link", { name: "Blueprints" })
				.getAttribute("aria-expanded")
		).toBe("false");
		expect(screen.queryByRole("link", { name: "Upload drawings" })).toBeNull();
	});
	it("expands on nested paths and marks the exact child current", async () => {
		await mount("/blueprints/upload");
		expect(
			screen
				.getByRole("link", { name: "Blueprints" })
				.getAttribute("aria-expanded")
		).toBe("true");
		expect(
			screen
				.getByRole("link", { name: "Upload drawings" })
				.getAttribute("aria-current")
		).toBe("page");
		expect(
			screen
				.getByRole("link", { name: "Building structure" })
				.getAttribute("aria-current")
		).toBeNull();
	});
});
