import { createFileRoute } from "@tanstack/react-router";
import { FieldProjectsPage } from "@/features/field/FieldProjectsPage";

export const Route = createFileRoute("/_field/field/")({
	component: FieldProjectsPage,
});
