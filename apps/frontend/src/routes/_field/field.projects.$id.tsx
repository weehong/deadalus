import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { FieldProjectPage } from "@/features/field/FieldProjectPage";

/** The drill-down; the selected Block and Storey ride in the search params. */
export const Route = createFileRoute("/_field/field/projects/$id")({
	validateSearch: z.object({
		block: z.string().optional(),
		storey: z.string().optional(),
	}),
	component: function FieldProjectRoute(): React.ReactElement {
		const { id } = Route.useParams();
		const search = Route.useSearch();
		return <FieldProjectPage id={id} search={search} />;
	},
});
