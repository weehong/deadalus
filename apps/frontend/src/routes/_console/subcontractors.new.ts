import { createFileRoute } from "@tanstack/react-router";
import { CreateSubcontractorPage } from "@/features/subcontractors/CreateSubcontractorPage";

export const Route = createFileRoute("/_console/subcontractors/new")({
	component: CreateSubcontractorPage,
});
