import { createFileRoute, redirect } from "@tanstack/react-router";

/** The Console has no home of its own: the root lands on Projects. */
export const Route = createFileRoute("/_console/")({
	beforeLoad: () => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
		throw redirect({ to: "/projects" });
	},
});
