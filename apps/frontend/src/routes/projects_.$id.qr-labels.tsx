import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { requireAdministratorSession } from "@/features/console/guard";
import { ProjectQrLabelsPage } from "@/features/projects/ProjectQrLabelsPage";

/**
 * The QR label page. It is behind the Administrator guard like every Console
 * screen, but deliberately outside the Console shell and the Project's tab
 * layout: it is printed, and a sidebar, header or tab strip on the paper
 * would be waste. `block` narrows the run to one Block.
 */
export const Route = createFileRoute("/projects_/$id/qr-labels")({
	validateSearch: z.object({ block: z.string().optional() }),
	beforeLoad: ({ context }) => {
		requireAdministratorSession(context);
	},
	component: function ProjectQrLabelsRoute(): React.ReactElement {
		const { id } = Route.useParams();
		const { block } = Route.useSearch();
		return <ProjectQrLabelsPage blockId={block} id={id} />;
	},
});
