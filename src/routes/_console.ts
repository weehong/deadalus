import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConsoleShell } from "@/pages/ConsoleShell";

// Every console screen sits under this pathless layout, so the Session guard lives here once.
export const Route = createFileRoute("/_console")({
	beforeLoad: ({ context, location }) => {
		if (!context.session)
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
			throw redirect({ to: "/sign-in", search: { redirect: location.href } });
	},
	component: ConsoleShell,
});
