import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	addCatalogueItem,
	renameCatalogueItem,
	deleteCatalogueItem,
	applyCatalogueItem,
	removeCatalogueItemFromUnits,
	type ApplyOutcome,
	type CatalogueItemInput,
	type RemoveOutcome,
} from "@/features/projects/catalogueItemsApi";
import type { Project } from "@/features/projects/types";
import type { UnitSelectionBody } from "@/features/projects/unit-selection";
import { projectKey } from "@/features/projects/useProjectQuery";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
interface RenameInput {
	id: string;
	input: CatalogueItemInput;
}
interface ApplyInput {
	id: string;
	selection: UnitSelectionBody;
}
/** Writes return the full Project, which replaces the cached detail directly. */
export const useCatalogueItemMutations = (
	projectId: string
): {
	add: UseMutationResult<Project, Error, CatalogueItemInput>;
	rename: UseMutationResult<Project, Error, RenameInput>;
	remove: UseMutationResult<void, Error, string>;
	apply: UseMutationResult<ApplyOutcome, Error, ApplyInput>;
	removeFromUnits: UseMutationResult<RemoveOutcome, Error, ApplyInput>;
} => {
	const client = useQueryClient();
	const onSuccess = async (project: Project): Promise<void> => {
		client.setQueryData(projectKey(projectId), project);
		await client.invalidateQueries({
			queryKey: projectKey(projectId),
			refetchType: "none",
		});
	};
	return {
		add: useMutation({
			mutationFn: (input: CatalogueItemInput) =>
				addCatalogueItem(projectId, input),
			onSuccess,
		}),
		rename: useMutation({
			mutationFn: ({ id, input }: RenameInput) =>
				renameCatalogueItem(projectId, id, input),
			onSuccess,
		}),
		apply: useMutation({
			mutationFn: ({ id, selection }: ApplyInput) =>
				applyCatalogueItem(projectId, id, selection),
			onSuccess: (outcome: ApplyOutcome) => onSuccess(outcome.project),
		}),
		removeFromUnits: useMutation({
			mutationFn: ({ id, selection }: ApplyInput) =>
				removeCatalogueItemFromUnits(projectId, id, selection),
			onSuccess: (outcome: RemoveOutcome) => onSuccess(outcome.project),
		}),
		remove: useMutation({
			mutationFn: (id: string) => deleteCatalogueItem(projectId, id),
			onSuccess: async (): Promise<void> => {
				await Promise.all([
					client.invalidateQueries({ queryKey: [...PROJECTS_KEY, "list"] }),
					client.invalidateQueries({ queryKey: projectKey(projectId) }),
				]);
			},
		}),
	};
};
