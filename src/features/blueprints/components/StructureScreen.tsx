/* eslint-disable camelcase -- provider-shaped screen props */
import { useTranslation } from "react-i18next";
import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/PageHeading";
import type {
	Drawing,
	FloorPlan,
	Installation,
	Site,
	Storey,
	Unit,
} from "../data/database";
import { FloorPlansTable, UnitsTable } from "./StructureChildrenTable";
import { FloorPlanDetail, StoreyDetail } from "./StructureDetail";
import { StructureTree, type StructureSelection } from "./StructureTree";
type Props = {
	site: Site;
	storeys: Array<Storey>;
	floorPlans: Array<FloorPlan>;
	units: Array<Unit>;
	drawings: Array<Drawing>;
	installations: Array<Installation>;
	selection?: StructureSelection;
	headingActions?: ReactNode;
	onAddFloorPlan?: (id: string) => void;
	onAddUnit?: (id: string) => void;
	onDeleteUnit?: (unit: Unit) => void;
	onEditUnit?: (unit: Unit) => void;
	onDeleteFloorPlan?: (plan: FloorPlan) => void;
	onEditFloorPlan?: (plan: FloorPlan) => void;
	onSelect: (value: StructureSelection) => void;
	onOpenUnit: (id: string) => void;
};
export const StructureScreen = ({
	site,
	storeys,
	floorPlans,
	units,
	drawings,
	installations,
	selection,
	headingActions,
	onAddFloorPlan,
	onAddUnit,
	onDeleteUnit,
	onEditUnit,
	onDeleteFloorPlan,
	onEditFloorPlan,
	onSelect,
	onOpenUnit,
}: Props) => {
	const { t } = useTranslation();
	const selected =
		selection ||
		(storeys[0] ? { kind: "storey" as const, id: storeys[0].id } : undefined);
	if (storeys.length === 0)
		return (
			<main>
				<PageHeading
					actions={headingActions}
					context={site.name}
					title={t("blueprints.structure")}
				/>
				<section>
					<h2>{t("blueprints.structureEmpty.title")}</h2>
					<p>{t("blueprints.structureEmpty.description")}</p>
				</section>
			</main>
		);
	const storey =
		selected?.kind === "storey"
			? storeys.find(({ id }) => id === selected.id)
			: undefined;
	const plan =
		selected?.kind === "floor-plan"
			? floorPlans.find(({ id }) => id === selected.id)
			: undefined;
	return (
		<main>
			<PageHeading
				actions={headingActions}
				context={site.name}
				title={t("blueprints.structure")}
			/>
			<div className="grid gap-6 lg:grid-cols-[minmax(16rem,1fr)_2fr]">
				<StructureTree
					floorPlans={floorPlans}
					selected={selected}
					storeys={storeys}
					units={units}
					onAddFloorPlan={onAddFloorPlan}
					onAddUnit={onAddUnit}
					onSelect={onSelect}
				/>
				<div>
					{storey && (
						<>
							<StoreyDetail
								floorPlans={floorPlans}
								storey={storey}
								units={units}
							/>
							<FloorPlansTable
								drawings={drawings}
								units={units}
								floorPlans={floorPlans.filter(
									({ storey_id }) => storey_id === storey.id
								)}
								onDelete={onDeleteFloorPlan}
								onEdit={onEditFloorPlan}
								onOpen={(id) => {
									onSelect({ kind: "floor-plan", id });
								}}
							/>
						</>
					)}
					{plan && (
						<>
							<FloorPlanDetail
								floorPlan={plan}
								storey={storeys.find(({ id }) => id === plan.storey_id)!}
								units={units}
								drawing={drawings.find(
									({ id }) => id === plan.source_drawing_id
								)}
							/>
							<UnitsTable
								installations={installations}
								units={units.filter(
									({ floor_plan_id }) => floor_plan_id === plan.id
								)}
								onDelete={onDeleteUnit}
								onEdit={onEditUnit}
								onOpen={onOpenUnit}
							/>
						</>
					)}
				</div>
			</div>
		</main>
	);
};
