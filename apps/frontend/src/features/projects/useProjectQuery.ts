import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiFetch } from "@/common/api";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
import type { Project } from "@/features/projects/types";
export const projectKey = (
	id: string
): readonly ["projects", "detail", string] => [...PROJECTS_KEY, "detail", id];
export const fetchProject = (id: string): Promise<Project> =>
	apiFetch<Project>(`/api/v1/projects/${encodeURIComponent(id)}`);
export const useProjectQuery = (id: string): UseQueryResult<Project, Error> =>
	useQuery({
		queryKey: projectKey(id),
		queryFn: (): Promise<Project> => fetchProject(id),
		retry: false,
	});
