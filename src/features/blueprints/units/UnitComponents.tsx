import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Table } from "@/components/ui/Table";
import { Tag, type TagTone } from "@/components/ui/Tag";
import type {
	Drawing,
	FloorPlan,
	Installation,
	Storey,
	Unit,
} from "../data/database";

export const UnitsList = ({
	floorPlans,
	selectedPlanId,
	units,
	onPlanChange,
	onOpen,
}: {
	floorPlans: Array<FloorPlan>;
	selectedPlanId: string;
	units: Array<Unit>;
	onPlanChange: (id: string) => void;
	onOpen: (id: string) => void;
}) => {
	const { t } = useTranslation();
	return (
		<>
			<label
				className="grid max-w-sm gap-2 font-semibold"
				htmlFor="floor-plan-selector"
			>
				{t("blueprints.fields.floorPlan")}
				<select
					className="min-h-11 border border-rule bg-surface px-3"
					id="floor-plan-selector"
					value={selectedPlanId}
					onChange={(event) => {
						onPlanChange(event.target.value);
					}}
				>
					{floorPlans.map((plan) => (
						<option key={plan.id} value={plan.id}>
							{plan.code} · {plan.name}
						</option>
					))}
				</select>
			</label>
			<div className="mt-6">
				<Table>
					<thead>
						<tr>
							<th>{t("blueprints.fields.code")}</th>
							<th>{t("blueprints.fields.usableArea")}</th>
							<th>{t("blueprints.fields.roomTags")}</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{units
							.filter((unit) => unit.floor_plan_id === selectedPlanId)
							.map((unit) => (
								<tr key={unit.id}>
									<td>{unit.code}</td>
									<td>{unit.usable_area}</td>
									<td>{unit.room_tags.join(", ")}</td>
									<td>
										<Button
											variant="ghost"
											onClick={() => {
												onOpen(unit.id);
											}}
										>
											{t("blueprints.open")}
										</Button>
									</td>
								</tr>
							))}
					</tbody>
				</Table>
			</div>
		</>
	);
};

export const UnitDetailCard = ({
	unit,
	onEdit,
}: {
	unit: Unit;
	onEdit: () => void;
}) => {
	const { t } = useTranslation();
	const values = [
		["usableArea", unit.usable_area],
		["roomTagCount", unit.room_tags.length],
		["ceilingHeight", unit.ceiling_height ?? "—"],
		["entryDoor", unit.entry_door ?? "—"],
		["boundaryType", unit.boundary_type ?? "—"],
		["tenancyStatus", unit.status],
		["gridReference", unit.grid_reference ?? "—"],
	] as const;
	return (
		<section className="border border-rule p-5">
			<div className="flex justify-between">
				<h2 className="font-heading text-2xl font-semibold">{unit.code}</h2>
				<Button variant="secondary" onClick={onEdit}>
					{t("blueprints.unit.edit")}
				</Button>
			</div>
			<dl className="mt-5 grid gap-4 sm:grid-cols-2">
				{values.map(([label, value]) => (
					<div key={label}>
						<dt className="text-xs uppercase text-steel-500">
							{t(`blueprints.unitDetail.${label}`, { defaultValue: label })}
						</dt>
						<dd>{value}</dd>
					</div>
				))}
			</dl>
		</section>
	);
};

const tones: Record<Installation["state"], TagTone> = {
	commissioning: "warning",
	live: "positive",
	scheduled: "neutral",
};
export const InstallationsTable = ({
	installations,
	onCreate,
	onDelete,
	onEdit,
}: {
	installations: Array<Installation>;
	onCreate?: () => void;
	onDelete: (item: Installation) => void;
	onEdit: (item: Installation) => void;
}) => {
	const { t } = useTranslation();
	const live = installations.filter(({ state }) => state === "live").length;
	const scheduled = installations.filter(
		({ state }) => state === "scheduled"
	).length;
	return (
		<section>
			<p className="mb-3 font-semibold">
				{t("blueprints.installations.summary", { live, scheduled })}
			</p>
			{installations.length === 0 ? (
				<div>
					<p>{t("blueprints.installations.empty")}</p>
					{onCreate && (
						<Button onClick={onCreate}>
							{t("blueprints.installations.create")}
						</Button>
					)}
				</div>
			) : (
				<Table>
					<thead>
						<tr>
							<th>{t("blueprints.installations.equipment")}</th>
							<th>{t("blueprints.installations.assetTag")}</th>
							<th>{t("blueprints.installations.location")}</th>
							<th>{t("blueprints.installations.installedDate")}</th>
							<th>{t("blueprints.installations.state")}</th>
							<th />
						</tr>
					</thead>
					<tbody>
						{installations.map((item) => (
							<tr key={item.id}>
								<td>
									{item.equipment}
									{item.model && (
										<span className="block text-steel-500">{item.model}</span>
									)}
								</td>
								<td>{item.asset_tag}</td>
								<td>{item.location_in_unit ?? "—"}</td>
								<td>{item.installed_date ?? "—"}</td>
								<td>
									<Tag tone={tones[item.state]}>
										{t(`blueprints.installations.${item.state}`)}
									</Tag>
								</td>
								<td>
									<Button
										variant="ghost"
										onClick={() => {
											onEdit(item);
										}}
									>
										{t("blueprints.edit")}
									</Button>
									<Button
										variant="ghost"
										onClick={() => {
											onDelete(item);
										}}
									>
										{t("blueprints.delete")}
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</Table>
			)}
		</section>
	);
};

export const UnitBreadcrumb = ({
	floorPlan,
	storey,
	unit,
}: {
	floorPlan: FloorPlan;
	storey: Storey;
	unit: Unit;
}) => {
	const { t } = useTranslation();
	return (
		<nav aria-label="Breadcrumb" className="text-sm">
			<ol className="flex flex-wrap gap-2">
				<li>
					<Link to="/blueprints/structure">{t("blueprints.structure")}</Link> /
				</li>
				<li>
					<Link
						search={{ id: storey.id, kind: "storey" }}
						to="/blueprints/structure"
					>
						{storey.name}
					</Link>{" "}
					/
				</li>
				<li>
					<Link
						search={{ id: floorPlan.id, kind: "floor-plan" }}
						to="/blueprints/structure"
					>
						{floorPlan.code}
					</Link>{" "}
					/
				</li>
				<li aria-current="page">{unit.code}</li>
			</ol>
		</nav>
	);
};

export const SheetReference = ({
	drawing,
	onOpen,
}: {
	drawing?: Drawing;
	onOpen: (drawing: Drawing) => void;
}) => {
	const { t } = useTranslation();
	return (
		<aside className="border border-rule p-5">
			<h2 className="font-heading text-xl font-semibold">
				{t("blueprints.sheet.title")}
			</h2>
			{drawing ? (
				<div className="mt-3 flex items-center justify-between gap-4">
					<p>{drawing.name}</p>
					<Button
						variant="secondary"
						onClick={() => {
							onOpen(drawing);
						}}
					>
						{t("blueprints.sheet.open")}
					</Button>
				</div>
			) : (
				<p className="mt-3">{t("blueprints.sheet.none")}</p>
			)}
		</aside>
	);
};
