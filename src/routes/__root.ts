import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";

export type RouterContext = { session: Session | null };
export const Route = createRootRouteWithContext<RouterContext>()({ component: Outlet });
