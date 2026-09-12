import { redirect } from "@tanstack/react-router";
import type { RouterContext } from "@/routes/__root";

/**
 * The Console's Session check. The shell's pathless layout applies it to
 * every screen inside the sidebar frame; the QR label page, which prints and
 * so carries no chrome of its own, applies it from outside that frame. An
 * Administrator Session is the only thing either of them asks for.
 */
export const requireAdministratorSession = (context: RouterContext): void => {
	if (!context.session)
		// eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack redirects are control-flow values.
		throw redirect({ to: "/login" });
};
