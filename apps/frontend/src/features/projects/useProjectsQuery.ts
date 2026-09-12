import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import {
	fetchProjects,
	type ProjectsListing,
	type ProjectsParameters,
} from "@/features/projects/api";
export const PROJECTS_KEY = ["projects"] as const;
export const useProjectsQuery = (
	parameters: ProjectsParameters
): UseQueryResult<ProjectsListing, Error> =>
	useQuery({
		queryKey: [...PROJECTS_KEY, "list", parameters],
		queryFn: (): Promise<ProjectsListing> => fetchProjects(parameters),
		retry: false,
	});
