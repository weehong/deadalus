import { z } from "@/lib/zod.js";
import { projectParametersSchema } from "@/schemas/project-detail.schema.js";
import { unitSelectionBodySchema } from "@/schemas/unit-selection.schema.js";
/** The target of an Assignment: a Subcontractor, or null to remove it. */
const target = z.string().min(1).nullable().openapi({
	description: "The Subcontractor to assign to; null removes the Assignment",
});
/**
 * Bulk assign: every selected Item made from the Catalogue Item goes to the
 * Subcontractor. Unassigned Items are always assigned; Items assigned
 * elsewhere only with `reassign`; Items already the target's are skipped.
 */
export const bulkAssignBodySchema = unitSelectionBodySchema.extend({
	catalogueItemId: z.string().min(1),
	subcontractorId: target,
	reassign: z.boolean().optional().openapi({
		description: "Also move Items assigned to another Subcontractor",
	}),
});
export type BulkAssignBody = z.infer<typeof bulkAssignBodySchema>;
export const assignMetaSchema = z.object({
	assigned: z.number().int().min(0).openapi({
		description: "Items whose Assignment changed",
	}),
	skipped: z.number().int().min(0).openapi({
		description:
			"Selected Items left alone: already the target's, assigned elsewhere without reassign, or unassigned when unassigning",
	}),
});
export type AssignMeta = z.infer<typeof assignMetaSchema>;
export const assignItemBodySchema = z.object({ subcontractorId: target });
export type AssignItemBody = z.infer<typeof assignItemBodySchema>;
export const itemParametersSchema = projectParametersSchema.extend({
	itemId: z.string().min(1),
});
