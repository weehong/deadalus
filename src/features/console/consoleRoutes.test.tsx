import { render, screen, within } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	createMemoryHistory,
	createRouter,
	RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import "@/common/i18n";

/* eslint-disable camelcase -- the provider's Session shape is snake_case. */
const session: Session = {
	access_token: "token",
	refresh_token: "refresh",
	expires_in: 3600,
	token_type: "bearer",
	user: {
		id: "00000000-0000-4000-8000-000000000001",
		aud: "authenticated",
		app_metadata: {},
		user_metadata: {},
		created_at: "2026-01-01T00:00:00.000Z",
	},
};
/* eslint-enable camelcase */

const mount = async (path: string, current: Session | null) => {
	const router = createRouter({
		routeTree,
		context: { session: current },
		history: createMemoryHistory({ initialEntries: [path] }),
	});
	render(
		<QueryClientProvider
			client={
				new QueryClient({ defaultOptions: { queries: { retry: false } } })
			}
		>
			<RouterProvider router={router} />
		</QueryClientProvider>
	);
	await router.load();
	return router;
};

const destinations = [
	{ path: "/", heading: "Operations console" },
	{ path: "/work-orders", heading: "Work orders" },
	{ path: "/system-status", heading: "System status" },
	{ path: "/assets", heading: "Assets" },
	{ path: "/operators", heading: "Operators" },
	{ path: "/settings", heading: "Settings" },
];

describe("console routes", () => {
	it("expands the Blueprints section only on Blueprint paths and marks its child current", async () => {
		await mount("/blueprints/subcontractors", session);
		const section = screen.getByRole("link", { name: "Blueprints" });
		expect(section.getAttribute("aria-expanded")).toBe("true");
		expect(
			screen
				.getByRole("link", { name: "Subcontractors" })
				.getAttribute("aria-current")
		).toBe("page");
	});

	it("redirects the bare Blueprints path to structure", async () => {
		const router = await mount("/blueprints", session);
		expect(router.state.location.pathname).toBe("/blueprints/structure");
	});

	it("wraps every screen in the shell: skip link first, sidebar navigation, current item marked", async () => {
		await mount("/work-orders", session);
		const skip = await screen.findByRole("link", { name: "Skip to content" });
		expect(skip.getAttribute("href")).toBe("#content");
		const links = within(screen.getByRole("navigation")).getAllByRole("link");
		expect(links).toHaveLength(7);
		expect(
			links.find((link) => link.getAttribute("aria-current") === "page")
				?.textContent
		).toContain("Work orders");
		expect(screen.getByRole("main").id).toBe("content");
		expect(screen.getByText("Last sync")).toBeTruthy();
		expect(screen.queryByText(/impaired/)).toBeNull();
	});

	for (const { path, heading } of destinations) {
		it(`${path} redirects a visitor without a Session to sign-in, preserving the path`, async () => {
			const router = await mount(path, null);
			expect(router.state.location.pathname).toBe("/sign-in");
			expect(router.state.location.search).toEqual({ redirect: path });
		});

		it(`${path} shows "${heading}" to an Administrator with a Session`, async () => {
			const router = await mount(path, session);
			expect(router.state.location.pathname).toBe(path);
			expect(
				await screen.findByRole("heading", { name: heading })
			).toBeTruthy();
		});
	}
});
