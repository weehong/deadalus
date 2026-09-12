import { apiFetch, apiFetchVoid } from "@/common/api";
import type { Project } from "@/features/projects/types";
export interface UnitTypeInput {
	code: string;
	description?: string | null;
}
const path = (projectId: string): string =>
	`/api/v1/projects/${encodeURIComponent(projectId)}/unit-types`;
export const addUnitType = (
	projectId: string,
	input: UnitTypeInput
): Promise<Project> =>
	apiFetch<Project>(path(projectId), {
		method: "POST",
		body: JSON.stringify(input),
	});
export const editUnitType = (
	projectId: string,
	id: string,
	input: Partial<UnitTypeInput>
): Promise<Project> =>
	apiFetch<Project>(`${path(projectId)}/${encodeURIComponent(id)}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
export const deleteUnitType = (projectId: string, id: string): Promise<void> =>
	apiFetchVoid(`${path(projectId)}/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});
