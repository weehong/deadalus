import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/common/api";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useProjectQuery } from "@/features/projects/useProjectQuery";
import { CatalogueItemsTable } from "@/features/projects/CatalogueItemsTable";
import {
	CatalogueItemForm,
	type CatalogueItemFailure,
} from "@/features/projects/CatalogueItemForm";
import { DeleteCatalogueItemDialog } from "@/features/projects/DeleteCatalogueItemDialog";
import {
	ApplyCatalogueItemDialog,
	type ApplyResult,
} from "@/features/projects/ApplyCatalogueItemDialog";
import {
	RemoveCatalogueItemDialog,
	type RemoveResult,
} from "@/features/projects/RemoveCatalogueItemDialog";
import {
	AssignCatalogueItemDialog,
	type AssignResult,
} from "@/features/projects/AssignCatalogueItemDialog";
import type { BulkAssignBody } from "@/features/projects/assignmentsApi";
import { useAssignmentMutations } from "@/features/projects/useAssignmentMutations";
import { useSubcontractorsQuery } from "@/features/subcontractors/useSubcontractorsQuery";
import type { UnitSelectionBody } from "@/features/projects/unit-selection";
import { useCatalogueItemMutations } from "@/features/projects/useCatalogueItemMutations";
import type { CatalogueItem } from "@/features/projects/types";
import type { CatalogueItemInput } from "@/features/projects/catalogueItemsApi";

/** Which dialog is open and for which Catalogue Item; each dialog owns its own submission. */
interface OpenDialog {
	kind: "apply" | "assign" | "remove" | "delete";
	catalogueItem: CatalogueItem;
}

/** The Items tab: the Project's Item Catalogue with inline add, rename and delete, and apply to, assign across or remove from Units. */
export const ProjectItemsPage = ({
	id,
}: {
	id: string;
}): React.ReactElement | null => {
	const { t } = useTranslation();
	const query = useProjectQuery(id);
	const mutations = useCatalogueItemMutations(id);
	const assignments = useAssignmentMutations(id);
	const [renaming, setRenaming] = useState<string>();
	const [rowFailure, setRowFailure] = useState<{
		id: string;
		message: string;
	}>();
	const [dialog, setDialog] = useState<OpenDialog>();
	const [assignSearch, setAssignSearch] = useState("");
	// The Assign dialog's Subcontractor select searches the Directory as the Administrator types.
	const directory = useSubcontractorsQuery(
		{ q: assignSearch, page: 1, pageSize: 20 },
		{ enabled: dialog?.kind === "assign" }
	);
	const busy =
		mutations.rename.isPending ||
		mutations.remove.isPending ||
		mutations.apply.isPending ||
		mutations.removeFromUnits.isPending ||
		assignments.bulk.isPending;
	const open = (
		kind: OpenDialog["kind"],
		catalogueItem: CatalogueItem
	): void => {
		setRowFailure(undefined);
		setDialog({ kind, catalogueItem });
	};
	const close = (): void => {
		setDialog(undefined);
		setAssignSearch("");
	};
	const save = async (
		input: CatalogueItemInput,
		catalogueItem?: CatalogueItem
	): Promise<CatalogueItemFailure | void> => {
		try {
			if (catalogueItem) {
				await mutations.rename.mutateAsync({ id: catalogueItem.id, input });
				setRenaming(undefined);
			} else await mutations.add.mutateAsync(input);
		} catch (error) {
			if (
				error instanceof ApiRequestError &&
				error.code === "CATALOGUE_ITEM_NAME_TAKEN"
			)
				return { field: "name", message: t("projects.items.nameTaken") };
			return { message: t("projects.items.error") };
		}
	};
	const refuse = (catalogueItem: CatalogueItem, count: number): void => {
		setRowFailure({
			id: catalogueItem.id,
			message: t("projects.items.inUse", { count }),
		});
	};
	// A Catalogue Item some Unit still holds is refused on its row; any other failure is the dialog's to show.
	const remove = async (catalogueItem: CatalogueItem): Promise<void> => {
		try {
			await mutations.remove.mutateAsync(catalogueItem.id);
			setRowFailure(undefined);
			close();
		} catch (error) {
			if (
				error instanceof ApiRequestError &&
				error.code === "CATALOGUE_ITEM_IN_USE"
			) {
				const details = error.details;
				const count =
					typeof details === "object" &&
					details !== null &&
					"itemCount" in details &&
					typeof details.itemCount === "number"
						? details.itemCount
						: catalogueItem.itemCount;
				refuse(catalogueItem, count);
				close();
				void query.refetch();
			} else throw error;
		}
	};
	const apply = async (
		catalogueItem: CatalogueItem,
		selection: UnitSelectionBody
	): Promise<ApplyResult> =>
		(await mutations.apply.mutateAsync({ id: catalogueItem.id, selection }))
			.meta;
	const removeFromUnits = async (
		catalogueItem: CatalogueItem,
		selection: UnitSelectionBody
	): Promise<RemoveResult> =>
		(
			await mutations.removeFromUnits.mutateAsync({
				id: catalogueItem.id,
				selection,
			})
		).meta;
	const assign = async (body: BulkAssignBody): Promise<AssignResult> =>
		(await assignments.bulk.mutateAsync(body)).meta;
	if (!query.data) return null;
	return (
		<>
			<CatalogueItemsTable
				catalogueItems={query.data.catalogueItems}
				footer={
					<CatalogueItemForm
						pending={mutations.add.isPending}
						onSubmit={(input) => save(input)}
					/>
				}
				renderActions={(catalogueItem) => (
					<div className="flex flex-wrap gap-2">
						<Button
							disabled={busy}
							variant="secondary"
							onClick={(): void => {
								open("apply", catalogueItem);
							}}
						>
							{t("projects.apply.action")}
						</Button>
						<Button
							disabled={busy}
							variant="secondary"
							onClick={(): void => {
								open("assign", catalogueItem);
							}}
						>
							{t("projects.assign.action")}
						</Button>
						<Button
							disabled={busy}
							variant="secondary"
							onClick={(): void => {
								open("remove", catalogueItem);
							}}
						>
							{t("projects.removeItems.action")}
						</Button>
						<Button
							disabled={busy}
							variant="secondary"
							onClick={(): void => {
								setRenaming(catalogueItem.id);
								setRowFailure(undefined);
							}}
						>
							{t("projects.items.rename")}
						</Button>
						<Button
							disabled={busy}
							variant="secondary"
							onClick={(): void => {
								if (catalogueItem.itemCount > 0) {
									refuse(catalogueItem, catalogueItem.itemCount);
								} else open("delete", catalogueItem);
							}}
						>
							{t("projects.items.delete")}
						</Button>
					</div>
				)}
				renderEditor={(catalogueItem) =>
					renaming === catalogueItem.id ||
					rowFailure?.id === catalogueItem.id ? (
						<>
							{rowFailure?.id === catalogueItem.id && (
								<div className="p-3">
									<Alert>{rowFailure.message}</Alert>
								</div>
							)}
							{renaming === catalogueItem.id && (
								<CatalogueItemForm
									key={catalogueItem.id}
									catalogueItem={catalogueItem}
									pending={mutations.rename.isPending}
									onSubmit={(input) => save(input, catalogueItem)}
									onCancel={(): void => {
										setRenaming(undefined);
									}}
								/>
							)}
						</>
					) : null
				}
			/>
			{dialog?.kind === "apply" && (
				<ApplyCatalogueItemDialog
					catalogueItem={dialog.catalogueItem}
					project={query.data}
					onClose={close}
					onSubmit={(selection): Promise<ApplyResult> =>
						apply(dialog.catalogueItem, selection)
					}
				/>
			)}
			{dialog?.kind === "assign" && (
				<AssignCatalogueItemDialog
					catalogueItem={dialog.catalogueItem}
					project={query.data}
					searching={directory.isFetching}
					subcontractors={directory.data?.data ?? []}
					onClose={close}
					onSearch={setAssignSearch}
					onSubmit={assign}
				/>
			)}
			{dialog?.kind === "remove" && (
				<RemoveCatalogueItemDialog
					catalogueItem={dialog.catalogueItem}
					project={query.data}
					onClose={close}
					onSubmit={(selection): Promise<RemoveResult> =>
						removeFromUnits(dialog.catalogueItem, selection)
					}
				/>
			)}
			{dialog?.kind === "delete" && (
				<DeleteCatalogueItemDialog
					open
					name={dialog.catalogueItem.name}
					onCancel={close}
					onConfirm={(): Promise<void> => remove(dialog.catalogueItem)}
				/>
			)}
		</>
	);
};
