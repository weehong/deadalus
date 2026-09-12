import { apiFetch, apiFetchEnvelope, apiFetchVoid } from "@/common/api";
import type { Project } from "@/features/projects/types";
import type { UnitSelectionBody } from "@/features/projects/unit-selection";
export interface CatalogueItemInput {
	name: string;
}
const path = (projectId: string): string =>
	`/api/v1/projects/${encodeURIComponent(projectId)}/catalogue-items`;
export const addCatalogueItem = (
	projectId: string,
	input: CatalogueItemInput
): Promise<Project> =>
	apiFetch<Project>(path(projectId), {
		method: "POST",
		body: JSON.stringify(input),
	});
export const renameCatalogueItem = (
	projectId: string,
	id: string,
	input: CatalogueItemInput
): Promise<Project> =>
	apiFetch<Project>(`${path(projectId)}/${encodeURIComponent(id)}`, {
		method: "PATCH",
		body: JSON.stringify(input),
	});
export const deleteCatalogueItem = (
	projectId: string,
	id: string
): Promise<void> =>
	apiFetchVoid(`${path(projectId)}/${encodeURIComponent(id)}`, {
		method: "DELETE",
	});
export interface ApplyOutcome {
	project: Project;
	meta: { added: number; skipped: number };
}
/** Create one Item in every selected Unit that holds none for this Catalogue Item. */
export const applyCatalogueItem = async (
	projectId: string,
	id: string,
	selection: UnitSelectionBody
): Promise<ApplyOutcome> => {
	const { data, meta } = await apiFetchEnvelope<
		Project,
		{ added: number; skipped: number }
	>(`${path(projectId)}/${encodeURIComponent(id)}/items`, {
		method: "POST",
		body: JSON.stringify(selection),
	});
	return { project: data, meta: meta ?? { added: 0, skipped: 0 } };
};
export interface RemoveOutcome {
	project: Project;
	meta: { removed: number; entriesRemoved: number };
}
/** Delete the Item made from this Catalogue Item in every selected Unit, with its Progress entries. */
export const removeCatalogueItemFromUnits = async (
	projectId: string,
	id: string,
	selection: UnitSelectionBody
): Promise<RemoveOutcome> => {
	const { data, meta } = await apiFetchEnvelope<
		Project,
		{ removed: number; entriesRemoved: number }
	>(`${path(projectId)}/${encodeURIComponent(id)}/items/remove`, {
		method: "POST",
		body: JSON.stringify(selection),
	});
	return { project: data, meta: meta ?? { removed: 0, entriesRemoved: 0 } };
};
