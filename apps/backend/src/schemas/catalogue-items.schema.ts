import { z } from "@/lib/zod.js";
import { projectParametersSchema } from "@/schemas/project-detail.schema.js";
export const catalogueItemBodySchema = z.object({
	name: z.string().trim().min(1).max(60).openapi({
		description: "Unique within the Project however it is spaced or cased",
	}),
});
export type CatalogueItemBody = z.infer<typeof catalogueItemBodySchema>;
export const catalogueItemParametersSchema = projectParametersSchema.extend({
	catalogueItemId: z.string().min(1),
});
