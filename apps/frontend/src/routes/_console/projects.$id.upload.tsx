import { createFileRoute } from "@tanstack/react-router";
import { UploadUnitMatrixPage } from "@/features/projects/UploadUnitMatrixPage";
export const Route = createFileRoute("/_console/projects/$id/upload")({
	component: function UploadRoute(): React.ReactElement {
		const { id } = Route.useParams();
		return <UploadUnitMatrixPage id={id} />;
	},
});
