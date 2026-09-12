import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { deleteProject } from "@/features/projects/api";
import { projectKey } from "@/features/projects/useProjectQuery";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
export const useDeleteProject = (
	id: string
): UseMutationResult<void, Error, void> => {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (): Promise<void> => deleteProject(id),
		onSuccess: async (): Promise<void> => {
			await client.invalidateQueries({ queryKey: [...PROJECTS_KEY, "list"] });
			client.removeQueries({ queryKey: projectKey(id), exact: true });
		},
	});
};
