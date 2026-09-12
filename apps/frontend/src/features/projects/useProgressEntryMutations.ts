import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import type { ProgressEntryInput, UnitItem } from "@/common/items";
import { enterProgress } from "@/features/projects/progressEntriesApi";
import { progressEntriesKey } from "@/features/projects/useProgressEntriesQuery";
import { projectKey } from "@/features/projects/useProjectQuery";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
import { unitItemsKey } from "@/features/projects/useUnitItemsQuery";
export interface EnterProgressInput extends ProgressEntryInput {
	itemId: string;
	/** The Item's Unit, whose cached Items the answer replaces. */
	unitId: string;
}
/**
 * Entering progress answers with the Unit's Items, which replace that cache
 * so the Item updates in place; the Item's history, the Project's roll-ups
 * and the Projects list are invalidated so an open History and every
 * Progression badge up the tree refresh without a reload.
 */
export const useEnterProgress = (
	projectId: string
): UseMutationResult<Array<UnitItem>, Error, EnterProgressInput> => {
	const client = useQueryClient();
	return useMutation({
		mutationFn: ({ itemId, value, note }: EnterProgressInput) =>
			enterProgress(
				projectId,
				itemId,
				note === undefined ? { value } : { value, note }
			),
		onSuccess: async (items, { unitId, itemId }): Promise<void> => {
			client.setQueryData(unitItemsKey(projectId, unitId), items);
			await Promise.all([
				client.invalidateQueries({
					queryKey: progressEntriesKey(projectId, itemId),
				}),
				client.invalidateQueries({
					queryKey: projectKey(projectId),
					exact: true,
				}),
				client.invalidateQueries({ queryKey: [...PROJECTS_KEY, "list"] }),
			]);
		},
	});
};
