import { z } from "@/lib/zod.js";
import { nameKey } from "@/lib/name-key.js";
import { projectParametersSchema } from "@/schemas/project-detail.schema.js";
export const structureNameSchema = z.string().trim().min(1).max(60);
export const batchNamesSchema = z
	.array(structureNameSchema)
	.min(1)
	.max(500)
	.refine((names) => new Set(names.map(nameKey)).size === names.length, {
		message: "Names must be unique within the batch",
	});
export const addBlocksBodySchema = z.object({ names: batchNamesSchema });
export const renameBlockBodySchema = z.object({ name: structureNameSchema });
export const blockParametersSchema = projectParametersSchema.extend({
	blockId: z.string().min(1),
});

export const addStoreysBodySchema = z.object({ names: batchNamesSchema });
export const renameStoreyBodySchema = z.object({ name: structureNameSchema });
export const storeyParametersSchema = projectParametersSchema.extend({
	storeyId: z.string().min(1),
});
