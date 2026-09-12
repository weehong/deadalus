import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	assignItem,
	bulkAssign,
	type BulkAssignBody,
	type BulkAssignOutcome,
} from "@/features/projects/assignmentsApi";
import type { UnitItem } from "@/common/items";
import { projectKey } from "@/features/projects/useProjectQuery";
import { unitItemsKey } from "@/features/projects/useUnitItemsQuery";
export interface AssignOneInput {
	itemId: string;
	/** The Item's Unit, whose cached Items the answer replaces. */
	unitId: string;
	subcontractorId: string | null;
}
/**
 * Bulk assign answers with the full Project, which replaces the cached
 * detail and invalidates every open Unit's Items; assigning one Item answers
 * with its Unit's Items, which replace that cache and refresh the Project's
 * per-Unit summary.
 */
export const useAssignmentMutations = (
	projectId: string
): {
	bulk: UseMutationResult<BulkAssignOutcome, Error, BulkAssignBody>;
	assignOne: UseMutationResult<Array<UnitItem>, Error, AssignOneInput>;
} => {
	const client = useQueryClient();
	return {
		bulk: useMutation({
			mutationFn: (body: BulkAssignBody) => bulkAssign(projectId, body),
			onSuccess: async (outcome: BulkAssignOutcome): Promise<void> => {
				client.setQueryData(projectKey(projectId), outcome.project);
				await client.invalidateQueries({
					queryKey: [...projectKey(projectId), "units"],
				});
			},
		}),
		assignOne: useMutation({
			mutationFn: ({ itemId, subcontractorId }: AssignOneInput) =>
				assignItem(projectId, itemId, subcontractorId),
			onSuccess: async (items, { unitId }): Promise<void> => {
				client.setQueryData(unitItemsKey(projectId, unitId), items);
				await client.invalidateQueries({
					queryKey: projectKey(projectId),
					exact: true,
				});
			},
		}),
	};
};
