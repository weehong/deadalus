import { render, screen } from "@testing-library/react";
import type { Session } from "@supabase/supabase-js";
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
	render(<RouterProvider router={router} />);
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
