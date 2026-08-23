/* eslint-disable camelcase, no-use-before-define -- route component consumes generated route params and provider rows */
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeading } from "@/components/ui/PageHeading";
import type { Installation } from "@/features/blueprints/data/database";
import { createDrawingSignedUrl } from "@/features/blueprints/data/drawings";
import {
	drawingHooks,
	floorPlanHooks,
	installationHooks,
	storeyHooks,
	unitHooks,
	useSitesQuery,
} from "@/features/blueprints/data/hooks";
import {
	UnitDialog,
	type UnitFormValues,
} from "@/features/blueprints/structure";
import {
	InstallationDialog,
	InstallationsTable,
	SheetReference,
	UnitBreadcrumb,
	UnitDetailCard,
	type InstallationFormValues,
} from "@/features/blueprints/units";

const UnitPage = () => {
	const { unitId } = Route.useParams();
	const { t } = useTranslation();
	const site = useSitesQuery().data?.[0];
	const unit = unitHooks.useRead(unitId).data;
	const plans = floorPlanHooks.useList(site?.id ?? "").data;
	const storeys = storeyHooks.useList(site?.id ?? "").data;
	const allItems = installationHooks.useList(site?.id ?? "").data;
	const drawings = drawingHooks.useList(site?.id ?? "").data;
	const createItem = installationHooks.useCreate(site?.id ?? "");
	const updateItem = installationHooks.useUpdate(site?.id ?? "");
	const removeItem = installationHooks.useDelete(site?.id ?? "");
	const updateUnit = unitHooks.useUpdate(site?.id ?? "");
	const [editUnit, setEditUnit] = useState(false);
	const [editItem, setEditItem] = useState<Installation | "new">();
	const [deleting, setDeleting] = useState<Installation>();
	const plan = plans?.find(({ id }) => id === unit?.floor_plan_id);
	const storey = storeys?.find(({ id }) => id === plan?.storey_id);
	const items = allItems?.filter(({ unit_id }) => unit_id === unitId) ?? [];
	const drawing = drawings?.find(({ id }) => id === plan?.source_drawing_id);
	if (!site || !unit || !plan || !storey)
		return <p>{t("blueprints.loading")}</p>;
	const unitValues: UnitFormValues = {
		boundaryNote: unit.boundary_note ?? "",
		code: unit.code,
		entryDoor: unit.entry_door ?? "",
		floorPlanId: unit.floor_plan_id,
		roomTags: unit.room_tags.join(", "),
		usableArea: unit.usable_area,
	};
	const itemValues: InstallationFormValues | undefined =
		editItem && editItem !== "new"
			? {
					assetTag: editItem.asset_tag,
					equipment: editItem.equipment,
					installedDate: editItem.installed_date ?? "",
					location: editItem.location_in_unit ?? "",
					model: editItem.model ?? "",
					state: editItem.state,
				}
			: undefined;
	return (
		<main>
			<UnitBreadcrumb floorPlan={plan} storey={storey} unit={unit} />
			<PageHeading
				context={site.name}
				title={`${t("blueprints.unitTitle")} ${unit.code}`}
				actions={
					<Button
						onClick={() => {
							setEditItem("new");
						}}
					>
						{t("blueprints.installations.create")}
					</Button>
				}
			/>
			<div className="grid gap-6">
				<UnitDetailCard
					unit={unit}
					onEdit={() => {
						setEditUnit(true);
					}}
				/>
				<InstallationsTable
					installations={items}
					onDelete={setDeleting}
					onEdit={setEditItem}
					onCreate={() => {
						setEditItem("new");
					}}
				/>
				<SheetReference
					drawing={drawing}
					onOpen={(item) => {
						void createDrawingSignedUrl(item.storage_path).then((url) => {
							window.open(url, "_blank", "noopener,noreferrer");
						});
					}}
				/>
			</div>
			<UnitDialog
				initialValues={unitValues}
				isOpen={editUnit}
				onClose={() => {
					setEditUnit(false);
				}}
				onSubmit={async (values) => {
					await updateUnit.mutateAsync({
						id: unit.id,
						value: {
							boundary_note: values.boundaryNote || null,
							code: values.code,
							entry_door: values.entryDoor || null,
							floor_plan_id: values.floorPlanId,
							room_tags: values.roomTags
								.split(",")
								.map((tag) => tag.trim())
								.filter(Boolean),
							usable_area: values.usableArea,
						},
					});
					setEditUnit(false);
				}}
			/>
			<InstallationDialog
				initialValues={itemValues}
				isOpen={Boolean(editItem)}
				onClose={() => {
					setEditItem(undefined);
				}}
				onSubmit={async (values) => {
					const value = {
						asset_tag: values.assetTag,
						equipment: values.equipment,
						installed_date: values.installedDate || null,
						location_in_unit: values.location || null,
						model: values.model || null,
						state: values.state,
						unit_id: unit.id,
					};
					if (editItem === "new")
						await createItem.mutateAsync({ ...value, site_id: site.id });
					else if (editItem)
						await updateItem.mutateAsync({ id: editItem.id, value });
					setEditItem(undefined);
				}}
			/>
			<ConfirmDialog
				itemName={deleting?.equipment ?? ""}
				open={Boolean(deleting)}
				title={t("blueprints.installations.delete")}
				onClose={() => {
					setDeleting(undefined);
				}}
				onConfirm={() => {
					if (deleting)
						void removeItem.mutateAsync(deleting.id).then(() => {
							setDeleting(undefined);
						});
				}}
			/>
		</main>
	);
};
export const Route = createFileRoute("/_console/blueprints/units/$unitId")({
	component: UnitPage,
});
