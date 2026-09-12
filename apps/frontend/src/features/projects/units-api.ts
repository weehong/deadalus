import { apiFetch, apiFetchVoid } from "@/common/api";
import type { Project } from "@/features/projects/types";
import type { UnitBatchInput } from "@/features/projects/UnitBatchForm";
export interface UnitEditInput {
	name?: string;
	unitTypeId?: string | null;
}
export const addUnits = (
	id: string,
	blockId: string,
	body: UnitBatchInput
): Promise<Project> =>
	apiFetch(
		`/api/v1/projects/${encodeURIComponent(id)}/blocks/${encodeURIComponent(blockId)}/units`,
		{ method: "POST", body: JSON.stringify(body) }
	);
export const editUnit = (
	id: string,
	unitId: string,
	body: UnitEditInput
): Promise<Project> =>
	apiFetch(
		`/api/v1/projects/${encodeURIComponent(id)}/units/${encodeURIComponent(unitId)}`,
		{ method: "PATCH", body: JSON.stringify(body) }
	);
export const deleteUnit = (id: string, unitId: string): Promise<void> =>
	apiFetchVoid(
		`/api/v1/projects/${encodeURIComponent(id)}/units/${encodeURIComponent(unitId)}`,
		{ method: "DELETE" }
	);
