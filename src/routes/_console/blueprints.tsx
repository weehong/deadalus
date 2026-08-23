import { createFileRoute, Outlet } from "@tanstack/react-router";
import { BlueprintSiteProvider } from "@/features/blueprints/BlueprintSiteContext";
export const Route = createFileRoute("/_console/blueprints")({
	component: () => (
		<BlueprintSiteProvider>
			<Outlet />
		</BlueprintSiteProvider>
	),
});
