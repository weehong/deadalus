import { createFileRoute } from "@tanstack/react-router";
import { ConsoleLayout } from "@/features/console/ConsoleLayout";
import { requireAdministratorSession } from "@/features/console/guard";

/**
 * Pathless layout: every Console screen sits under it, so the Session check
 * lives here once and the guarded component never mounts for a visitor. Its
 * component is the Console shell, so every child renders inside the sidebar
 * frame.
 */
export const Route = createFileRoute("/_console")({
	beforeLoad: ({ context }) => {
		requireAdministratorSession(context);
	},
	component: ConsoleLayout,
});
