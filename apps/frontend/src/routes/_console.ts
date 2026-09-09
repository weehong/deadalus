import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConsoleLayout } from "@/features/console/ConsoleLayout";

/**
 * Pathless layout: every Console screen sits under it, so the Session check
 * lives here once and the guarded component never mounts for a visitor. Its
 * component is the Console shell, so every child renders inside the sidebar
 * frame.
 */
export const Route = createFileRoute("/_console")({
	beforeLoad: ({ context }) => {
		if (!context.session)
			// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
			throw redirect({ to: "/login" });
	},
	component: ConsoleLayout,
});
