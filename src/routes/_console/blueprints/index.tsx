import { createFileRoute, redirect } from "@tanstack/react-router";
export const Route = createFileRoute("/_console/blueprints/")({
	beforeLoad: () => {
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
		throw redirect({ to: "/blueprints/structure" });
	},
});
