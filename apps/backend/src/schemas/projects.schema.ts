import { z } from "@/lib/zod.js";
export const listProjectsQuerySchema = z
	.object({
		q: z.string().trim().optional().openapi({
			description: "Case-insensitive Project name or code substring",
		}),
		page: z.coerce.number().int().min(1).max(2147483647).default(1),
		pageSize: z.coerce
			.number()
			.int()
			.min(1)
			.transform((value) => Math.min(value, 100))
			.default(20)
			.openapi({ type: "integer", minimum: 1, maximum: 100, default: 20 }),
	})
	.refine(({ page, pageSize }) => (page - 1) * pageSize <= 2147483647, {
		path: ["page"],
		message: "Page exceeds the supported Projects range",
	});
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;

export const projectCodeSchema = z
	.string()
	.trim()
	.toUpperCase()
	.min(2)
	.max(12)
	.regex(/^[A-Z0-9-]+$/);
export const createProjectBodySchema = z.object({
	name: z.string().trim().min(1).max(60),
	code: projectCodeSchema,
});
export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;

export const editProjectBodySchema = createProjectBodySchema
	.partial()
	.refine(({ name, code }) => name !== undefined || code !== undefined, {
		message: "Provide a name or code",
	});
export type EditProjectBody = z.infer<typeof editProjectBodySchema>;

const unitTypeCodeSchema = z.string().trim().min(1).max(40);
const unitTypeDescriptionSchema = z
	.string()
	.trim()
	.max(120)
	.nullable()
	.optional();
export const addUnitTypeBodySchema = z.object({
	code: unitTypeCodeSchema,
	description: unitTypeDescriptionSchema,
});
export type AddUnitTypeBody = z.infer<typeof addUnitTypeBodySchema>;
export const editUnitTypeBodySchema = addUnitTypeBodySchema
	.partial()
	.refine(
		(value) => value.code !== undefined || value.description !== undefined,
		{ message: "Provide a code or description" }
	);
export type EditUnitTypeBody = z.infer<typeof editUnitTypeBodySchema>;
export const unitTypeParametersSchema = z.object({
	id: z.string().min(1),
	unitTypeId: z.string().min(1),
});
