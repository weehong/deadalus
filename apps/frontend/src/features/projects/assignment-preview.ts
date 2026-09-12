import type { Unit } from "@/features/projects/types";

/**
 * What a bulk assign will do, computed from the loaded Project so the Assign
 * dialog's count line is exact before the API, the authority, answers.
 */
export interface AssignmentPreview {
	/** Items with no Assignment: always assigned, or skipped when unassigning. */
	unassigned: number;
	/** Items assigned to another Subcontractor: skipped, reassigned when asked, or unassigned. */
	elsewhere: number;
	/** Items already assigned to the target: always skipped. */
	same: number;
}

/** Over the selected Units' Items made from the Catalogue Item, how each stands against the target. */
export const previewAssignment = (
	selected: Array<Unit>,
	catalogueItemId: string,
	subcontractorId: string | null
): AssignmentPreview => {
	const preview = { unassigned: 0, elsewhere: 0, same: 0 };
	for (const unit of selected)
		for (const item of unit.items) {
			if (item.catalogueItemId !== catalogueItemId) continue;
			if (item.subcontractorId === null) preview.unassigned += 1;
			else if (item.subcontractorId === subcontractorId) preview.same += 1;
			else preview.elsewhere += 1;
		}
	return preview;
};
