import { createFileRoute } from "@tanstack/react-router";
import { DestinationStub } from "@/pages/DestinationStub";

export const Route = createFileRoute("/_console/settings")({
	component: () => <DestinationStub label="nav.settings" />,
});
