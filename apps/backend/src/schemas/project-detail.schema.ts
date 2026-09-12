import { z } from "@/lib/zod.js";
export const projectParametersSchema = z.object({ id: z.string().min(1) });
const positioned = {
	id: z.string(),
	name: z.string(),
	position: z.number().int(),
};
export const projectSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
	blocks: z.array(
		z.object({
			...positioned,
			storeys: z.array(
				z.object({
					...positioned,
					units: z.array(
						z.object({ ...positioned, unitTypeId: z.string().nullable() })
					),
				})
			),
		})
	),
	unitTypes: z.array(
		z.object({
			id: z.string(),
			code: z.string(),
			description: z.string().nullable(),
			unitCount: z.number().int().min(0),
		})
	),
});
export type Project = z.infer<typeof projectSchema>;
