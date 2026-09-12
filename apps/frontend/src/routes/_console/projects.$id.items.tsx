import { createFileRoute } from "@tanstack/react-router";
import { ProjectItemsPage } from "@/features/projects/ProjectItemsPage";

export const Route = createFileRoute("/_console/projects/$id/items")({
	component: function ItemsRoute(): React.ReactElement {
		const { id } = Route.useParams();
		return <ProjectItemsPage id={id} />;
	},
});
