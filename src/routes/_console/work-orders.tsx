import { createFileRoute } from "@tanstack/react-router";
import { DestinationStub } from "@/pages/DestinationStub";

export const Route = createFileRoute("/_console/work-orders")({
	component: () => <DestinationStub label="nav.workOrders" />,
});
