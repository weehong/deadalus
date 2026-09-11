import { createFileRoute } from "@tanstack/react-router";
import { SubcontractorPage } from "@/features/subcontractors/SubcontractorPage";

export const Route = createFileRoute("/_console/subcontractors/$id")({
	component: function SubcontractorScreen(): React.ReactElement {
		const { id } = Route.useParams();
		return <SubcontractorPage id={id} />;
	},
});
