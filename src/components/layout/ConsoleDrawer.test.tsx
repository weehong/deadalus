import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
	createMemoryHistory,
	createRootRoute,
	createRoute,
	createRouter,
	Link,
	Outlet,
	RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import "@/common/i18n";
import { ConsoleDrawer } from "./ConsoleDrawer";

const rootRoute = createRootRoute({ component: Outlet });
const indexRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/",
	component: () => (
		<ConsoleDrawer
			sidebar={
				<nav aria-label="Primary">
					<Link to="/assets">Destination</Link>
				</nav>
			}
		/>
	),
});
const destinationRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: "/assets",
	component: () => <h1>Assets page</h1>,
});
const routeTree = rootRoute.addChildren([indexRoute, destinationRoute]);

const mount = async () => {
	const router = createRouter({
		routeTree,
		history: createMemoryHistory({ initialEntries: ["/"] }),
	});
	render(<RouterProvider router={router} />);
	await router.load();
	return router;
};

describe("ConsoleDrawer", () => {
	it("opens with its state announced and closes on Escape, returning focus", async () => {
		await mount();
		const user = userEvent.setup();
		const button = await screen.findByRole("button", {
			name: "Open navigation",
		});
		expect(button.getAttribute("aria-expanded")).toBe("false");

		await user.click(button);
		expect(button.getAttribute("aria-expanded")).toBe("true");
		expect(
			screen.getByRole("dialog", { name: "Console navigation" })
		).toBeTruthy();
		expect(document.documentElement.style.overflow).toBe("hidden");

		await user.keyboard("{Escape}");
		await waitFor(() => {
			expect(button.getAttribute("aria-expanded")).toBe("false");
		});
		expect(document.activeElement).toBe(button);
		expect(document.documentElement.style.overflow).not.toBe("hidden");
	});

	it("closes when its backdrop is clicked", async () => {
		await mount();
		const user = userEvent.setup();
		const button = await screen.findByRole("button", {
			name: "Open navigation",
		});
		await user.click(button);

		const dialog = screen.getByRole("dialog", { name: "Console navigation" });
		// A backdrop is deliberately hidden from the accessibility tree; it is the
		// dialog's first rendered layer, before the visible panel wrapper.
		fireEvent.click(dialog.firstElementChild as Element);
		await waitFor(() => {
			expect(button.getAttribute("aria-expanded")).toBe("false");
		});
		expect(document.activeElement).toBe(button);
	});

	it("closes after navigating with a sidebar link", async () => {
		const router = await mount();
		const user = userEvent.setup();
		const button = await screen.findByRole("button", {
			name: "Open navigation",
		});
		await user.click(button);
		await user.click(screen.getByRole("link", { name: "Destination" }));

		await waitFor(() => {
			expect(router.state.location.pathname).toBe("/assets");
		});
		expect(
			await screen.findByRole("heading", { name: "Assets page" })
		).toBeTruthy();
	});
});
