import { z } from "zod";
export const projectFormSchema = z.object({
	name: z.string().trim().min(1, "nameRequired").max(60, "nameTooLong"),
	code: z
		.string()
		.trim()
		.toUpperCase()
		.min(1, "codeRequired")
		.min(2, "codeInvalid")
		.max(12, "codeInvalid")
		.regex(/^[A-Z0-9-]+$/, "codeInvalid"),
});
export type ProjectValues = z.infer<typeof projectFormSchema>;
export interface ProjectFailure {
	field?: "name" | "code";
	message: string;
}
