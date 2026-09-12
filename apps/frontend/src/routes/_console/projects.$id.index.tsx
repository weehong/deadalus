import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProjectStructurePage } from "@/features/projects/ProjectStructurePage";

export const Route = createFileRoute("/_console/projects/$id/")({
	validateSearch: z.object({
		imported: z.boolean().optional(),
		importedOmitted: z.array(z.string()).optional(),
		importedTypes: z.number().int().nonnegative().optional(),
		importedBlocks: z.number().int().nonnegative().optional(),
		importedStoreys: z.number().int().nonnegative().optional(),
		importedUnits: z.number().int().nonnegative().optional(),
		block: z.string().optional(),
		storey: z.string().optional(),
	}),
	component: function StructureRoute(): React.ReactElement {
		const { id } = Route.useParams();
		const search = Route.useSearch();
		return <ProjectStructurePage id={id} search={search} />;
	},
});
