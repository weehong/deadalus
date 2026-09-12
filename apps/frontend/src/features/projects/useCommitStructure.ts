import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/common/api";
import type { Project } from "@/features/projects/types";
import type { StructureBody } from "@/features/projects/matrix-to-structure";
import { projectKey } from "@/features/projects/useProjectQuery";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
export const useCommitStructure = (
	id: string
): ReturnType<typeof useMutation<Project, Error, StructureBody>> => {
	const client = useQueryClient();
	return useMutation({
		mutationFn: (body: StructureBody) =>
			apiFetch<Project>(
				`/api/v1/projects/${encodeURIComponent(id)}/structure`,
				{ method: "POST", body: JSON.stringify(body) }
			),
		onSuccess: async (project): Promise<void> => {
			client.setQueryData(projectKey(id), project);
			await client.invalidateQueries({ queryKey: [...PROJECTS_KEY, "list"] });
		},
	});
};
