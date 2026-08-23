import { createFileRoute } from "@tanstack/react-router";
import { DestinationStub } from "@/pages/DestinationStub";

export const Route = createFileRoute("/_console/assets")({
	component: () => <DestinationStub label="nav.assets" />,
});
