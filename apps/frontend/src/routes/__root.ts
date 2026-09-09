import type { Session } from "@supabase/supabase-js";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";

/** The Session read model reaches route guards through router context. */
export type RouterContext = { session: Session | null };

export const Route = createRootRouteWithContext<RouterContext>()({
	component: Outlet,
});
