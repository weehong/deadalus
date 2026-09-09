import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

/**
 * Pathless layout: every guarded screen sits under it, so the Session check
 * lives here once and the guarded component never mounts for a visitor.
 */
export const Route = createFileRoute("/_console")({
	beforeLoad: ({ context }) => {
		if (!context.session)
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
			throw redirect({ to: "/login" });
	},
	component: Outlet,
});
