import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { editProject, type EditProjectInput } from "@/features/projects/api";
import { projectKey } from "@/features/projects/useProjectQuery";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
import type { Project } from "@/features/projects/types";
export const useEditProject = (
	id: string
): UseMutationResult<Project, Error, EditProjectInput> => {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (input: EditProjectInput): Promise<Project> =>
			editProject(id, input),
		onSuccess: async (project): Promise<void> => {
			client.setQueryData(projectKey(id), project);
			await client.invalidateQueries({
				queryKey: projectKey(id),
				refetchType: "none",
			});
			await client.invalidateQueries({ queryKey: [...PROJECTS_KEY, "list"] });
		},
	});
};
