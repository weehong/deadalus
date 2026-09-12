import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/common/api";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useProjectQuery } from "@/features/projects/useProjectQuery";
import { UnitTypesTable } from "@/features/projects/UnitTypesTable";
import {
	UnitTypeForm,
	type UnitTypeFailure,
} from "@/features/projects/UnitTypeForm";
import { DeleteUnitTypeDialog } from "@/features/projects/DeleteUnitTypeDialog";
import { useUnitTypeMutations } from "@/features/projects/useUnitTypeMutations";
import type { UnitType } from "@/features/projects/types";
import type { UnitTypeInput } from "@/features/projects/unitTypesApi";

export const ProjectUnitTypesPage = ({
	id,
}: {
	id: string;
}): React.ReactElement | null => {
	const { t } = useTranslation();
	const query = useProjectQuery(id);
	const mutations = useUnitTypeMutations(id);
	const [editing, setEditing] = useState<string>();
	const [deleting, setDeleting] = useState<UnitType>();
	const [rowFailure, setRowFailure] = useState<{
		id: string;
		message: string;
	}>();
	const [deleteFailure, setDeleteFailure] = useState<string>();
	const save = async (
		input: UnitTypeInput,
		unitType?: UnitType
	): Promise<UnitTypeFailure | void> => {
		try {
			if (unitType) {
				await mutations.edit.mutateAsync({ id: unitType.id, input });
				setEditing(undefined);
			} else await mutations.add.mutateAsync(input);
		} catch (error) {
			if (
				error instanceof ApiRequestError &&
				error.code === "UNIT_TYPE_CODE_TAKEN"
			)
				return { field: "code", message: t("projects.unitTypes.codeTaken") };
			return { message: t("projects.unitTypes.error") };
		}
	};
	const remove = async (): Promise<void> => {
		if (!deleting || mutations.remove.isPending) return;
		setDeleteFailure(undefined);
		try {
			await mutations.remove.mutateAsync(deleting.id);
			setDeleting(undefined);
			setRowFailure(undefined);
		} catch (error) {
			if (
				error instanceof ApiRequestError &&
				error.code === "UNIT_TYPE_IN_USE"
			) {
				const details = error.details;
				const count =
					typeof details === "object" &&
					details !== null &&
					"unitCount" in details &&
					typeof details.unitCount === "number"
						? details.unitCount
						: deleting.unitCount;
				setRowFailure({
					id: deleting.id,
					message: t("projects.unitTypes.inUse", { count }),
				});
				setDeleting(undefined);
				void query.refetch();
			} else setDeleteFailure(t("projects.unitTypes.deleteError"));
		}
	};
	if (!query.data) return null;
	return (
		<>
			<UnitTypesTable
				unitTypes={query.data.unitTypes}
				footer={
					<UnitTypeForm
						pending={mutations.add.isPending}
						onSubmit={(input) => save(input)}
					/>
				}
				renderActions={(unitType) => (
					<div className="flex flex-wrap gap-2">
						<Button
							disabled={mutations.edit.isPending || mutations.remove.isPending}
							variant="secondary"
							onClick={(): void => {
								setEditing(unitType.id);
								setRowFailure(undefined);
							}}
						>
							{t("projects.unitTypes.edit")}
						</Button>
						<Button
							disabled={mutations.edit.isPending || mutations.remove.isPending}
							variant="secondary"
							onClick={(): void => {
								setRowFailure(undefined);
								setDeleteFailure(undefined);
								if (unitType.unitCount > 0)
									setRowFailure({
										id: unitType.id,
										message: t("projects.unitTypes.inUse", {
											count: unitType.unitCount,
										}),
									});
								else setDeleting(unitType);
							}}
						>
							{t("projects.unitTypes.delete")}
						</Button>
					</div>
				)}
				renderEditor={(unitType) =>
					editing === unitType.id || rowFailure?.id === unitType.id ? (
						<>
							{rowFailure?.id === unitType.id && (
								<div className="p-3">
									<Alert>{rowFailure.message}</Alert>
								</div>
							)}
							{editing === unitType.id && (
								<UnitTypeForm
									key={unitType.id}
									pending={mutations.edit.isPending}
									unitType={unitType}
									onSubmit={(input) => save(input, unitType)}
									onCancel={(): void => {
										setEditing(undefined);
									}}
								/>
							)}
						</>
					) : null
				}
			/>
			<DeleteUnitTypeDialog
				code={deleting?.code ?? ""}
				error={deleteFailure}
				open={Boolean(deleting)}
				pending={mutations.remove.isPending}
				onCancel={(): void => {
					setDeleting(undefined);
				}}
				onConfirm={(): void => {
					void remove();
				}}
			/>
		</>
	);
};
