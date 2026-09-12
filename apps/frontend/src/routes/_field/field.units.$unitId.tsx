import { createFileRoute } from "@tanstack/react-router";
import { FieldUnitPage } from "@/features/field/FieldUnitPage";

/** The Unit's screen: its Items with Progress entry and History. */
export const Route = createFileRoute("/_field/field/units/$unitId")({
	component: function FieldUnitRoute(): React.ReactElement {
		const { unitId } = Route.useParams();
		return <FieldUnitPage unitId={unitId} />;
	},
});
