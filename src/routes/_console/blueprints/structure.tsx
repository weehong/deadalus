/* eslint-disable camelcase, no-use-before-define -- provider rows and generated Route API. */
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StructureScreen } from "@/features/blueprints/components/StructureScreen";
import type { StructureSelection } from "@/features/blueprints/components/StructureTree";
import {
	drawingHooks,
	floorPlanHooks,
	installationHooks,
	storeyHooks,
	unitHooks,
	useSitesQuery,
} from "@/features/blueprints/data/hooks";
import {
	FloorPlanDialog,
	StoreyDialog,
	UnitDialog,
	type FloorPlanFormValues,
	type StoreyFormValues,
	type UnitFormValues,
} from "@/features/blueprints/structure";
import type {
	FloorPlan,
	Storey,
	Unit,
} from "@/features/blueprints/data/database";
import { parseStructureSearch } from "@/features/blueprints/structure/structureSearch";

const StructurePage = () => {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const search = Route.useSearch();
	const sites = useSitesQuery();
	const site = sites.data?.[0];
	const storeys = storeyHooks.useList(site?.id ?? "");
	const plans = floorPlanHooks.useList(site?.id ?? "");
	const units = unitHooks.useList(site?.id ?? "");
	const drawingRows = drawingHooks.useList(site?.id ?? "");
	const installations = installationHooks.useList(site?.id ?? "");
	const createStorey = storeyHooks.useCreate(site?.id ?? "");
	const updateStorey = storeyHooks.useUpdate(site?.id ?? "");
	const deleteStorey = storeyHooks.useDelete(site?.id ?? "");
	const createPlan = floorPlanHooks.useCreate(site?.id ?? "");
	const updatePlan = floorPlanHooks.useUpdate(site?.id ?? "");
	const deletePlan = floorPlanHooks.useDelete(site?.id ?? "");
	const createUnit = unitHooks.useCreate(site?.id ?? "");
	const updateUnit = unitHooks.useUpdate(site?.id ?? "");
	const deleteUnit = unitHooks.useDelete(site?.id ?? "");
	const [storeyDialog, setStoreyDialog] = useState<Storey | "new">();
	const [planDialog, setPlanDialog] = useState<
		FloorPlan | { parentId: string }
	>();
	const [unitDialog, setUnitDialog] = useState<Unit | { parentId: string }>();
	const [deleting, setDeleting] = useState<Storey | FloorPlan | Unit>();
	const [deleteError, setDeleteError] = useState<string>();
	useEffect(() => {
		const first = storeys.data?.[0];
		if (!search.id && first) {
			void navigate({
				to: "/blueprints/structure",
				search: { id: first.id, kind: "storey" },
				replace: true,
			});
		}
	}, [navigate, search.id, storeys.data]);
	if (sites.isPending) return <p role="status">{t("blueprints.loading")}</p>;
	if (!site)
		return (
			<section>
				<h1>{t("blueprints.structure")}</h1>
				<p>{t("blueprints.noSite")}</p>
			</section>
		);
	if (
		[storeys, plans, units, drawingRows, installations].some(
			(query) => query.isPending
		)
	)
		return <p role="status">{t("blueprints.loading")}</p>;
	const selection: StructureSelection | undefined =
		search.id && search.kind ? { id: search.id, kind: search.kind } : undefined;
	const selectedStorey =
		selection?.kind === "storey"
			? storeys.data?.find(({ id }) => id === selection.id)
			: storeys.data?.[0];
	const selectedPlan =
		selection?.kind === "floor-plan"
			? plans.data?.find(({ id }) => id === selection.id)
			: undefined;
	const blockedReason =
		deleting &&
		("level_from" in deleting
			? plans.data?.some(({ storey_id }) => storey_id === deleting.id)
				? t("blueprints.errors.deleteFloorPlansFirst")
				: undefined
			: "slab_level" in deleting
				? units.data?.some(({ floor_plan_id }) => floor_plan_id === deleting.id)
					? t("blueprints.errors.deleteUnitsFirst")
					: undefined
				: installations.data?.some(({ unit_id }) => unit_id === deleting.id)
					? t("blueprints.errors.deleteInstallationsFirst")
					: undefined);
	const headingActions = (
		<>
			<Button
				onClick={() => {
					setStoreyDialog("new");
				}}
			>
				{t("blueprints.storey.create")}
			</Button>
			{selectedStorey && (
				<>
					<Button
						variant="secondary"
						onClick={() => {
							setPlanDialog({ parentId: selectedStorey.id });
						}}
					>
						{t("blueprints.floorPlan.create")}
					</Button>
					<Button
						variant="ghost"
						onClick={() => {
							setStoreyDialog(selectedStorey);
						}}
					>
						{t("blueprints.edit")}
					</Button>
					<Button
						variant="ghost"
						onClick={() => {
							setDeleting(selectedStorey);
						}}
					>
						{t("blueprints.delete")}
					</Button>
				</>
			)}
			{selectedPlan && (
				<>
					<Button
						variant="secondary"
						onClick={() => {
							setUnitDialog({ parentId: selectedPlan.id });
						}}
					>
						{t("blueprints.unit.create")}
					</Button>
					<Button
						variant="ghost"
						onClick={() => {
							setPlanDialog(selectedPlan);
						}}
					>
						{t("blueprints.edit")}
					</Button>
					<Button
						variant="ghost"
						onClick={() => {
							setDeleting(selectedPlan);
						}}
					>
						{t("blueprints.delete")}
					</Button>
				</>
			)}
		</>
	);
	return (
		<>
			<StructureScreen
				drawings={drawingRows.data ?? []}
				floorPlans={plans.data ?? []}
				headingActions={headingActions}
				installations={installations.data ?? []}
				selection={selection}
				site={site}
				storeys={storeys.data ?? []}
				units={units.data ?? []}
				onDeleteFloorPlan={setDeleting}
				onDeleteUnit={setDeleting}
				onEditFloorPlan={setPlanDialog}
				onEditUnit={setUnitDialog}
				onAddFloorPlan={(id) => {
					setPlanDialog({ parentId: id });
				}}
				onAddUnit={(id) => {
					setUnitDialog({ parentId: id });
				}}
				onOpenUnit={(unitId) => {
					void navigate({
						to: "/blueprints/units/$unitId",
						params: { unitId },
					});
				}}
				onSelect={(value) => {
					void navigate({
						to: "/blueprints/structure",
						search: value,
						replace: true,
					});
				}}
			/>
			<StoreyDialog
				isOpen={Boolean(storeyDialog)}
				initialValues={
					storeyDialog && storeyDialog !== "new"
						? {
								levelFrom: storeyDialog.level_from,
								levelTo: storeyDialog.level_to,
								name: storeyDialog.name,
								number: storeyDialog.number,
								structuralNote: storeyDialog.structural_note ?? "",
							}
						: undefined
				}
				onClose={() => {
					setStoreyDialog(undefined);
				}}
				onSubmit={async (values: StoreyFormValues) => {
					const value = {
						level_from: values.levelFrom,
						level_to: values.levelTo,
						name: values.name,
						number: values.number,
						site_id: site.id,
						structural_note: values.structuralNote || null,
					};
					if (storeyDialog === "new") await createStorey.mutateAsync(value);
					else if (storeyDialog)
						await updateStorey.mutateAsync({ id: storeyDialog.id, value });
					setStoreyDialog(undefined);
				}}
			/>
			<FloorPlanDialog
				isOpen={Boolean(planDialog)}
				initialValues={
					planDialog && "id" in planDialog
						? {
								code: planDialog.code,
								grossArea: planDialog.gross_area,
								name: planDialog.name,
								slabLevel: planDialog.slab_level,
								storeyId: planDialog.storey_id,
								structuralGrid: planDialog.structural_grid ?? "",
							}
						: planDialog
							? {
									code: "",
									grossArea: Number.NaN,
									name: "",
									slabLevel: Number.NaN,
									storeyId: planDialog.parentId,
									structuralGrid: "",
								}
							: undefined
				}
				onClose={() => {
					setPlanDialog(undefined);
				}}
				onSubmit={async (values: FloorPlanFormValues) => {
					const value = {
						code: values.code,
						gross_area: values.grossArea,
						name: values.name,
						site_id: site.id,
						slab_level: values.slabLevel,
						source_drawing_id: null,
						storey_id: values.storeyId,
						structural_grid: values.structuralGrid || null,
					};
					if (planDialog && "id" in planDialog)
						await updatePlan.mutateAsync({ id: planDialog.id, value });
					else await createPlan.mutateAsync(value);
					setPlanDialog(undefined);
				}}
			/>
			<UnitDialog
				isOpen={Boolean(unitDialog)}
				initialValues={
					unitDialog && "id" in unitDialog
						? {
								boundaryNote: unitDialog.boundary_note ?? "",
								code: unitDialog.code,
								entryDoor: unitDialog.entry_door ?? "",
								floorPlanId: unitDialog.floor_plan_id,
								roomTags: unitDialog.room_tags.join(", "),
								usableArea: unitDialog.usable_area,
							}
						: unitDialog
							? {
									boundaryNote: "",
									code: "",
									entryDoor: "",
									floorPlanId: unitDialog.parentId,
									roomTags: "",
									usableArea: Number.NaN,
								}
							: undefined
				}
				onClose={() => {
					setUnitDialog(undefined);
				}}
				onSubmit={async (values: UnitFormValues) => {
					const value = {
						boundary_note: values.boundaryNote || null,
						code: values.code,
						entry_door: values.entryDoor || null,
						floor_plan_id: values.floorPlanId,
						room_tags: values.roomTags
							.split(",")
							.map((tag) => tag.trim())
							.filter(Boolean),
						usable_area: values.usableArea,
					};
					if (unitDialog && "id" in unitDialog)
						await updateUnit.mutateAsync({ id: unitDialog.id, value });
					else
						await createUnit.mutateAsync({
							...value,
							boundary_type: null,
							ceiling_height: null,
							grid_reference: null,
							site_id: site.id,
							status: "vacant",
						});
					setUnitDialog(undefined);
				}}
			/>
			<ConfirmDialog
				blockedReason={deleteError ?? blockedReason}
				open={Boolean(deleting)}
				title={t("blueprints.deleteItem")}
				itemName={
					deleting ? ("name" in deleting ? deleting.name : deleting.code) : ""
				}
				onClose={() => {
					setDeleting(undefined);
					setDeleteError(undefined);
				}}
				onConfirm={() => {
					if (!deleting) return;
					const mutation =
						"level_from" in deleting
							? deleteStorey
							: "slab_level" in deleting
								? deletePlan
								: deleteUnit;
					void mutation
						.mutateAsync(deleting.id)
						.then(() => {
							setDeleting(undefined);
						})
						.catch(() => {
							setDeleteError(t("blueprints.errors.blockedDelete"));
						});
				}}
			/>
		</>
	);
};
export const Route = createFileRoute("/_console/blueprints/structure")({
	component: StructurePage,
	validateSearch: parseStructureSearch,
});
