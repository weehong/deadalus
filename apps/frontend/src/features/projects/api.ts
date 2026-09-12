import type { Project } from "@/features/projects/types";
import {
	apiFetch,
	apiFetchVoid,
	apiFetchEnvelope,
	type PaginationMeta,
} from "@/common/api";
export interface ProjectRow {
	id: string;
	code: string;
	name: string;
	blockCount: number;
	storeyCount: number;
	unitCount: number;
	itemCount: number;
	/** The plain average of every Item beneath the Project; null with no Items. */
	progression: number | null;
}
export interface ProjectsListing {
	data: Array<ProjectRow>;
	meta: PaginationMeta;
}
export interface ProjectsParameters {
	q?: string;
	page: number;
	pageSize: number;
}
export const fetchProjects = async (
	parameters: ProjectsParameters
): Promise<ProjectsListing> => {
	const query = new URLSearchParams({
		page: parameters.page.toString(),
		pageSize: parameters.pageSize.toString(),
	});
	if (parameters.q) query.set("q", parameters.q.trim());
	const response = await apiFetchEnvelope<Array<ProjectRow>>(
		`/api/v1/projects?${query.toString()}`
	);
	if (!response.meta) throw new Error("Missing Projects pagination metadata");
	return { data: response.data, meta: response.meta };
};

export interface CreateProjectInput {
	name: string;
	code: string;
}
export const createProject = (input: CreateProjectInput): Promise<Project> =>
	apiFetch<Project>("/api/v1/projects", {
		method: "POST",
		body: JSON.stringify(input),
	});

export type EditProjectInput = Partial<CreateProjectInput>;
export const editProject = (
	id: string,
	input: EditProjectInput
): Promise<Project> =>
	apiFetch<Project>(`/api/v1/projects/${encodeURIComponent(id)}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
export const deleteProject = (id: string): Promise<void> =>
	apiFetchVoid(`/api/v1/projects/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});
