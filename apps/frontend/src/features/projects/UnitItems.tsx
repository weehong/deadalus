import type { UseQueryResult } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { ProgressEntry, UnitItem } from "@/common/items";
import { ProgressEntryPanel } from "@/components/progress/ProgressEntryPanel";
import { UnitItemsDisclosure } from "@/features/projects/UnitItemsDisclosure";
import { useAssignmentMutations } from "@/features/projects/useAssignmentMutations";
import { useProgressEntriesQuery } from "@/features/projects/useProgressEntriesQuery";
import { useEnterProgress } from "@/features/projects/useProgressEntryMutations";
import { useUnitItemsQuery } from "@/features/projects/useUnitItemsQuery";
import { useSubcontractorsQuery } from "@/features/subcontractors/useSubcontractorsQuery";
/**
 * One Unit's Items on its card, read when the disclosure opens; the
 * Directory's first page feeds each select, and each Item gets an entry
 * panel reading its history under the Project's cache keys.
 */
export const UnitItems = ({
	projectId,
	unitId,
}: {
	projectId: string;
	unitId: string;
}): React.ReactElement => {
	const { t } = useTranslation();
	const [open, setOpen] = useState(false);
	const query = useUnitItemsQuery(projectId, unitId, open);
	const directory = useSubcontractorsQuery(
		{ page: 1, pageSize: 100 },
		{ enabled: open }
	);
	const { assignOne } = useAssignmentMutations(projectId);
	const enter = useEnterProgress(projectId);
	const useHistory = (
		itemId: string,
		enabled: boolean
	): UseQueryResult<Array<ProgressEntry>, Error> =>
		useProgressEntriesQuery(projectId, itemId, enabled);
	return (
		<UnitItemsDisclosure
			error={query.isError ? t("projects.unitItems.error") : undefined}
			items={query.data}
			loading={query.isLoading}
			open={open}
			subcontractors={directory.data?.data ?? []}
			assignError={
				assignOne.isError ? t("projects.unitItems.assignError") : undefined
			}
			pendingItemId={
				assignOne.isPending ? assignOne.variables.itemId : undefined
			}
			renderItemDetails={(item): React.ReactElement => (
				<ProgressEntryPanel
					item={item}
					pending={enter.isPending && enter.variables.itemId === item.id}
					useHistory={useHistory}
					onEnter={(itemId, input): Promise<Array<UnitItem>> =>
						enter.mutateAsync({ itemId, unitId, ...input })
					}
				/>
			)}
			onAssign={(item, subcontractorId): void => {
				assignOne.mutate({ itemId: item.id, unitId, subcontractorId });
			}}
			onRetry={(): void => {
				void query.refetch();
			}}
			onToggle={(): void => {
				setOpen((value) => !value);
			}}
		/>
	);
};
