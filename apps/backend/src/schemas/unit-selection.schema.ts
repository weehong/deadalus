import { z } from "@/lib/zod.js";
const idList = z.array(z.string().min(1)).min(1).max(2000);
/**
 * The Unit selection of apply, remove and bulk assign. Each filter is a
 * non-empty list when given; a Unit is selected when it matches every filter
 * given, and no filters selects every Unit of the Project.
 */
export const unitSelectionBodySchema = z.object({
	blockIds: idList.optional().openapi({ description: "Blocks of the Project" }),
	storeyIds: idList
		.optional()
		.openapi({ description: "Storeys of the Project" }),
	unitTypeIds: idList.optional().openapi({
		description:
			"Unit Types of the Project; a Unit without a Unit Type never matches",
	}),
});
export type UnitSelectionBody = z.infer<typeof unitSelectionBodySchema>;
export const applyMetaSchema = z.object({
	added: z.number().int().min(0).openapi({
		description: "Items created, one per selected Unit that held none",
	}),
	skipped: z.number().int().min(0).openapi({
		description: "Selected Units that already held an Item made from it",
	}),
});
export type ApplyMeta = z.infer<typeof applyMetaSchema>;
export const removeMetaSchema = z.object({
	removed: z.number().int().min(0).openapi({
		description: "Items deleted, one per selected Unit that held one",
	}),
	entriesRemoved: z.number().int().min(0).openapi({
		description:
			"Progress entries those Items carried, counted before the cascade removed them",
	}),
});
export type RemoveMeta = z.infer<typeof removeMetaSchema>;
