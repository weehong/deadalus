import { z } from "@/lib/zod.js";
import {
	batchNamesSchema,
	structureNameSchema,
} from "@/schemas/structure.schema.js";
import { projectParametersSchema } from "@/schemas/project-detail.schema.js";
export const addUnitsBodySchema = z
	.object({
		storeyIds: z
			.array(z.string().min(1))
			.min(1)
			.max(200)
			.refine(
				(ids) => new Set(ids).size === ids.length,
				"Storeys must be unique"
			),
		names: batchNamesSchema,
		unitTypeId: z.string().min(1).optional(),
	})
	.refine(
		(body) => body.storeyIds.length * body.names.length <= 2000,
		"At most 2000 Units per batch"
	);
export const editUnitBodySchema = z
	.object({
		name: structureNameSchema.optional(),
		unitTypeId: z.string().min(1).nullable().optional(),
	})
	.refine(
		(body) => body.name !== undefined || body.unitTypeId !== undefined,
		"Supply a name or Unit Type"
	);
export const unitParametersSchema = projectParametersSchema.extend({
	unitId: z.string().min(1),
});
export type AddUnitsBody = z.infer<typeof addUnitsBodySchema>;
export type EditUnitBody = z.infer<typeof editUnitBodySchema>;
