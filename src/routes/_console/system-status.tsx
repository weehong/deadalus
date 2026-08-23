import { createFileRoute } from "@tanstack/react-router";
import { DestinationStub } from "@/pages/DestinationStub";

export const Route = createFileRoute("/_console/system-status")({
	component: () => <DestinationStub label="nav.systemStatus" />,
});
