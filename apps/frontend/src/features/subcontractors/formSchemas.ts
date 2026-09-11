import { z } from "zod";

/** Plausibility only: preserve the Administrator's input for server normalization. */
const plausiblePhone = (input: string): boolean => {
	const compact = input.replace(/[\s\-()[\].]/g, "");
	return (
		/^(?:\+|00)[1-9]\d{7,14}$/.test(compact) ||
		(!compact.startsWith("00") && /^\d{6,13}$/.test(compact))
	);
};
export const memberFieldsSchema = z.object({
	name: z.string().trim().min(1, "memberNameRequired"),
	phone: z
		.string()
		.trim()
		.min(1, "phoneRequired")
		.refine(plausiblePhone, "phoneInvalid"),
});
export const createSubcontractorSchema = z.object({
	name: z.string().trim().min(1, "nameRequired"),
	member: memberFieldsSchema,
});
export type CreateSubcontractorValues = z.infer<
	typeof createSubcontractorSchema
>;
export interface CreateSubcontractorFailure {
	field?: "name" | "member.phone";
	message: string;
}

export const renameSubcontractorSchema = createSubcontractorSchema.pick({
	name: true,
});
export type RenameSubcontractorValues = z.infer<
	typeof renameSubcontractorSchema
>;
export interface RenameSubcontractorFailure {
	field?: "name";
	message: string;
}

export type MemberValues = z.infer<typeof memberFieldsSchema>;
export interface MemberFailure {
	field?: "name" | "phone";
	message: string;
}
