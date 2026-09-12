import { createFileRoute } from "@tanstack/react-router";
import { ProjectLayout } from "@/features/projects/ProjectLayout";

export const Route = createFileRoute("/_console/projects/$id")({
	component: function ProjectRoute(): React.ReactElement {
		const { id } = Route.useParams();
		return <ProjectLayout id={id} />;
	},
});
