import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	createProject,
	type CreateProjectInput,
} from "@/features/projects/api";
import type { Project } from "@/features/projects/types";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
export const useCreateProject = (): UseMutationResult<
	Project,
	Error,
	CreateProjectInput
> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createProject,
		onSuccess: async (project): Promise<void> => {
			queryClient.setQueryData(
				[...PROJECTS_KEY, "detail", project.id],
				project
			);
			await queryClient.invalidateQueries({
				queryKey: [...PROJECTS_KEY, "list"],
			});
		},
	});
};
