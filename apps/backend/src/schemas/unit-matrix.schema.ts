import { z } from "@/lib/zod.js";
export const unitMatrixWarningSchema = z.object({
	code: z
		.enum([
			"EMPTY_STOREY",
			"DUPLICATE_STOREY",
			"NON_CONSECUTIVE_STACKS",
			"INFERRED_STACKS",
			"EMPTY_BLOCK",
		])
		.describe(
			"Stable warning code for client translation: omitted empty Storey, ignored repeated Storey, irregular stack numbers, inferred stack numbers, or retained empty Block."
		),
	label: z
		.string()
		.optional()
		.describe(
			"Original workbook Storey label for EMPTY_STOREY and DUPLICATE_STOREY."
		),
	message: z.string(),
});
export const unitMatrixBlockSchema = z.object({
	name: z.string(),
	stacks: z.array(z.string()),
	storeys: z.array(
		z.object({ name: z.string(), cells: z.array(z.string().nullable()) })
	),
	unitCount: z.number().int().nonnegative(),
	warnings: z.array(unitMatrixWarningSchema),
});
export const unitMatrixPreviewSchema = z.object({
	sheets: z.array(
		z.object({
			name: z.string(),
			blocks: z.array(unitMatrixBlockSchema),
			warnings: z.array(unitMatrixWarningSchema),
		})
	),
});
export type UnitMatrixBlock = z.infer<typeof unitMatrixBlockSchema>;
export type UnitMatrixPreview = z.infer<typeof unitMatrixPreviewSchema>;
