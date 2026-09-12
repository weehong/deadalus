import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	addUnitType,
	editUnitType,
	deleteUnitType,
	type UnitTypeInput,
} from "@/features/projects/unitTypesApi";
import type { Project } from "@/features/projects/types";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
interface EditInput {
	id: string;
	input: Partial<UnitTypeInput>;
}
export const useUnitTypeMutations = (
	projectId: string
): {
	add: UseMutationResult<Project, Error, UnitTypeInput>;
	edit: UseMutationResult<Project, Error, EditInput>;
	remove: UseMutationResult<void, Error, string>;
} => {
	const client = useQueryClient();
	const onSuccess = async (project: Project): Promise<void> => {
		client.setQueryData([...PROJECTS_KEY, "detail", projectId], project);
		await Promise.all([
			client.invalidateQueries({ queryKey: [...PROJECTS_KEY, "list"] }),
			client.invalidateQueries({
				queryKey: [...PROJECTS_KEY, "detail", projectId],
				refetchType: "none",
			}),
		]);
	};
	return {
		add: useMutation({
			mutationFn: (input: UnitTypeInput) => addUnitType(projectId, input),
			onSuccess,
		}),
		edit: useMutation({
			mutationFn: ({ id, input }: EditInput) =>
				editUnitType(projectId, id, input),
			onSuccess,
		}),
		remove: useMutation({
			mutationFn: (id: string) => deleteUnitType(projectId, id),
			onSuccess: async (): Promise<void> => {
				await Promise.all([
					client.invalidateQueries({ queryKey: [...PROJECTS_KEY, "list"] }),
					client.invalidateQueries({
						queryKey: [...PROJECTS_KEY, "detail", projectId],
					}),
				]);
			},
		}),
	};
};
