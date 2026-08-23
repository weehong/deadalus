/* eslint-disable camelcase -- provider-shaped read models */
import { useTranslation } from "react-i18next";
import type { Drawing, FloorPlan, Installation, Unit } from "../data/database";
const Table = ({
	headers,
	children,
}: {
	headers: Array<string>;
	children: React.ReactNode;
}) => {
	return (
		<div className="overflow-x-auto">
			<table>
				<thead>
					<tr>
						{headers.map((header) => (
							<th key={header} scope="col">
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody>{children}</tbody>
			</table>
		</div>
	);
};
export const FloorPlansTable = ({
	floorPlans,
	units,
	drawings,
	onDelete,
	onEdit,
	onOpen,
}: {
	floorPlans: Array<FloorPlan>;
	units: Array<Unit>;
	drawings: Array<Drawing>;
	onDelete?: (plan: FloorPlan) => void;
	onEdit?: (plan: FloorPlan) => void;
	onOpen: (id: string) => void;
}) => {
	const { t } = useTranslation();
	return (
		<Table
			headers={[
				t("blueprints.structureFields.code"),
				t("blueprints.fields.name"),
				t("blueprints.structureFields.slabLevel"),
				t("blueprints.structureFields.grossArea"),
				t("blueprints.structureFields.units"),
				t("blueprints.structureFields.sourceDrawing"),
				"",
			]}
		>
			{floorPlans.map((plan) => (
				<tr key={plan.id}>
					<td>{plan.code}</td>
					<td>{plan.name}</td>
					<td>{plan.slab_level} m</td>
					<td>{plan.gross_area} m²</td>
					<td>
						{
							units.filter(({ floor_plan_id }) => floor_plan_id === plan.id)
								.length
						}
					</td>
					<td>
						{drawings.find(({ id }) => id === plan.source_drawing_id)?.name ||
							"—"}
					</td>
					<td>
						{onEdit && (
							<button
								type="button"
								onClick={() => {
									onEdit(plan);
								}}
							>
								{t("blueprints.editNamed", { name: plan.name })}
							</button>
						)}
						{onDelete && (
							<button
								type="button"
								onClick={() => {
									onDelete(plan);
								}}
							>
								{t("blueprints.deleteNamed", { name: plan.name })}
							</button>
						)}
						<button
							type="button"
							onClick={() => {
								onOpen(plan.id);
							}}
						>
							{t("blueprints.openNamed", { name: plan.name })}
						</button>
					</td>
				</tr>
			))}
		</Table>
	);
};
export const UnitsTable = ({
	units,
	installations,
	onDelete,
	onEdit,
	onOpen,
}: {
	units: Array<Unit>;
	installations: Array<Installation>;
	onDelete?: (unit: Unit) => void;
	onEdit?: (unit: Unit) => void;
	onOpen: (id: string) => void;
}) => {
	const { t } = useTranslation();
	return (
		<Table
			headers={[
				t("blueprints.structureFields.code"),
				t("blueprints.structureFields.roomTags"),
				t("blueprints.structureFields.area"),
				t("blueprints.structureFields.entryDoor"),
				t("blueprints.structureFields.installations"),
				t("blueprints.structureFields.status"),
				"",
			]}
		>
			{units.map((unit) => (
				<tr key={unit.id}>
					<td>{unit.code}</td>
					<td>{unit.room_tags.join(", ") || "—"}</td>
					<td>{unit.usable_area} m²</td>
					<td>{unit.entry_door || "—"}</td>
					<td>
						{installations.filter(({ unit_id }) => unit_id === unit.id).length}
					</td>
					<td>{unit.status}</td>
					<td>
						{onEdit && (
							<button
								type="button"
								onClick={() => {
									onEdit(unit);
								}}
							>
								{t("blueprints.editNamed", { name: unit.code })}
							</button>
						)}
						{onDelete && (
							<button
								type="button"
								onClick={() => {
									onDelete(unit);
								}}
							>
								{t("blueprints.deleteNamed", { name: unit.code })}
							</button>
						)}
						<button
							type="button"
							onClick={() => {
								onOpen(unit.id);
							}}
						>
							{t("blueprints.openNamed", { name: unit.code })}
						</button>
					</td>
				</tr>
			))}
		</Table>
	);
};
