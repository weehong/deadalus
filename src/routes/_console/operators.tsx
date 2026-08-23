import { createFileRoute } from "@tanstack/react-router";
import { DestinationStub } from "@/pages/DestinationStub";

export const Route = createFileRoute("/_console/operators")({
	component: () => <DestinationStub label="nav.operators" />,
});
