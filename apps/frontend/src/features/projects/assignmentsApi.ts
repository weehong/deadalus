import { apiFetch, apiFetchEnvelope } from "@/common/api";
import type { Project } from "@/features/projects/types";
import type { UnitSelectionBody } from "@/features/projects/unit-selection";
import type { UnitItem } from "@/common/items";
/** The bulk assign body: the Catalogue Item, the target (null unassigns) and the Unit selection. */
export interface BulkAssignBody extends UnitSelectionBody {
	catalogueItemId: string;
	subcontractorId: string | null;
	/** Also move Items assigned to another Subcontractor. */
	reassign?: boolean;
}
export interface AssignMeta {
	assigned: number;
	skipped: number;
}
export interface BulkAssignOutcome {
	project: Project;
	meta: AssignMeta;
}
const path = (projectId: string): string =>
	`/api/v1/projects/${encodeURIComponent(projectId)}`;
export const bulkAssign = async (
	projectId: string,
	body: BulkAssignBody
): Promise<BulkAssignOutcome> => {
	const { data, meta } = await apiFetchEnvelope<Project, AssignMeta>(
		`${path(projectId)}/assignments`,
		{ method: "POST", body: JSON.stringify(body) }
	);
	return { project: data, meta: meta ?? { assigned: 0, skipped: 0 } };
};
/** Set, change (a Subcontractor id) or clear (null) one Item's Assignment; answers with its Unit's Items. */
export const assignItem = (
	projectId: string,
	itemId: string,
	subcontractorId: string | null
): Promise<Array<UnitItem>> =>
	apiFetch<Array<UnitItem>>(
		`${path(projectId)}/items/${encodeURIComponent(itemId)}`,
		{ method: "PATCH", body: JSON.stringify({ subcontractorId }) }
	);
