import { createFileRoute } from "@tanstack/react-router";
import { Subcontractors } from "@/pages/Subcontractors";

export const Route = createFileRoute("/_console/subcontractors/")({
	component: Subcontractors,
});
