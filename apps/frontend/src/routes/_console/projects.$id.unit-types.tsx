import { createFileRoute } from "@tanstack/react-router";
import { ProjectUnitTypesPage } from "@/features/projects/ProjectUnitTypesPage";

export const Route = createFileRoute("/_console/projects/$id/unit-types")({
	component: function UnitTypesRoute(): React.ReactElement {
		const { id } = Route.useParams();
		return <ProjectUnitTypesPage id={id} />;
	},
});
