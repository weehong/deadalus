import { normalizePhone } from "@/lib/normalize-phone.js";
import { z } from "@/lib/zod.js";

export const listSubcontractorsQuerySchema = z
	.object({
		q: z.string().trim().optional().openapi({
			description:
				"Case-insensitive Subcontractor or Member name substring, or Member phone digits (ignoring formatting and a missing country code)",
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
		message: "Page exceeds the supported Directory range",
	});
export type ListSubcontractorsQuery = z.infer<
	typeof listSubcontractorsQuerySchema
>;

export const subcontractorParametersSchema = z.object({
	id: z.string().min(1),
});

export const memberParametersSchema = subcontractorParametersSchema.extend({
	memberId: z.string().min(1),
});

export const subcontractorNameSchema = z
	.string()
	.trim()
	.min(1, "Subcontractor name is required");
export const memberBodySchema = z.object({
	name: z.string().trim().min(1, "Member name is required"),
	phone: z
		.string()
		.transform((input, context) => {
			const phone = normalizePhone(input);
			if (phone === null) {
				context.addIssue({
					code: "custom",
					message: "Enter a valid phone number",
				});
				return z.NEVER;
			}
			return phone;
		})
		.openapi({
			type: "string",
			description: "Phone input is normalized to E.164 by the server.",
		}),
});
export const createSubcontractorBodySchema = z.object({
	name: subcontractorNameSchema,
	member: memberBodySchema,
});
export type CreateSubcontractorBody = z.infer<
	typeof createSubcontractorBodySchema
>;

export const renameSubcontractorBodySchema = z.object({
	name: subcontractorNameSchema,
});
export type RenameSubcontractorBody = z.infer<
	typeof renameSubcontractorBodySchema
>;

export type MemberBody = z.infer<typeof memberBodySchema>;

export const editMemberBodySchema = memberBodySchema
	.partial()
	.refine((input) => input.name !== undefined || input.phone !== undefined, {
		message: "Provide a name or phone",
	});
export type EditMemberBody = z.infer<typeof editMemberBodySchema>;
