import { createFileRoute } from "@tanstack/react-router";
import { CreateProjectPage } from "@/features/projects/CreateProjectPage";

export const Route = createFileRoute("/_console/projects/new")({
	component: CreateProjectPage,
});
