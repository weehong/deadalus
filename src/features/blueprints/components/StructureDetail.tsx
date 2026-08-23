/* eslint-disable camelcase -- provider-shaped read models */
import { useTranslation } from "react-i18next";
import type { Drawing, FloorPlan, Storey, Unit } from "../data/database";
const value = (number: number, suffix = "") =>
	`${number.toLocaleString()}${suffix}`;
const Row = ({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) => (
	<div>
		<dt className="text-sm text-muted">{label}</dt>
		<dd>{children}</dd>
	</div>
);
export const StoreyDetail = ({
	storey,
	floorPlans,
	units,
}: {
	storey: Storey;
	floorPlans: Array<FloorPlan>;
	units: Array<Unit>;
}) => {
	const { t } = useTranslation();
	const plans = floorPlans.filter(({ storey_id }) => storey_id === storey.id);
	const planIds = new Set(plans.map(({ id }) => id));
	return (
		<section aria-labelledby="storey-detail">
			<h2 id="storey-detail">{storey.name}</h2>
			<dl className="grid grid-cols-2 gap-4">
				<Row label={t("blueprints.structureFields.number")}>
					{storey.number}
				</Row>
				<Row label={t("blueprints.structureFields.levelFrom")}>
					{value(storey.level_from, " m")}
				</Row>
				<Row label={t("blueprints.structureFields.levelTo")}>
					{value(storey.level_to, " m")}
				</Row>
				<Row label={t("blueprints.structureFields.storeyHeight")}>
					{value(storey.level_to - storey.level_from, " m")}
				</Row>
				<Row label={t("blueprints.structureFields.floorPlans")}>
					{plans.length}
				</Row>
				<Row label={t("blueprints.structureFields.units")}>
					{
						units.filter(({ floor_plan_id }) => planIds.has(floor_plan_id))
							.length
					}
				</Row>
				<Row label={t("blueprints.structureFields.structuralNote")}>
					{storey.structural_note || "—"}
				</Row>
				<Row label={t("blueprints.structureFields.lastEdited")}>
					{new Date(storey.updated_at).toLocaleString()}
				</Row>
			</dl>
		</section>
	);
};
export const FloorPlanDetail = ({
	floorPlan,
	storey,
	units,
	drawing,
}: {
	floorPlan: FloorPlan;
	storey: Storey;
	units: Array<Unit>;
	drawing?: Drawing;
}) => {
	const { t } = useTranslation();
	return (
		<section aria-labelledby="plan-detail">
			<h2 id="plan-detail">{floorPlan.name}</h2>
			<dl className="grid grid-cols-2 gap-4">
				<Row label={t("blueprints.structureFields.code")}>{floorPlan.code}</Row>
				<Row label={t("blueprints.structureFields.slabLevel")}>
					{value(floorPlan.slab_level, " m")}
				</Row>
				<Row label={t("blueprints.structureFields.storeyHeight")}>
					{value(storey.level_to - storey.level_from, " m")}
				</Row>
				<Row label={t("blueprints.structureFields.grossArea")}>
					{value(floorPlan.gross_area, " m²")}
				</Row>
				<Row label={t("blueprints.structureFields.units")}>
					{
						units.filter(({ floor_plan_id }) => floor_plan_id === floorPlan.id)
							.length
					}
				</Row>
				<Row label={t("blueprints.structureFields.sourceDrawing")}>
					{drawing?.name || t("blueprints.sheet.none")}
				</Row>
				<Row label={t("blueprints.structureFields.structuralGrid")}>
					{floorPlan.structural_grid || "—"}
				</Row>
				<Row label={t("blueprints.structureFields.lastEdited")}>
					{new Date(floorPlan.updated_at).toLocaleString()}
				</Row>
			</dl>
		</section>
	);
};
