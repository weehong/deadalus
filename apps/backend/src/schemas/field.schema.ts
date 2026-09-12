import { z } from "@/lib/zod.js";

/** The whole credential for the Field's sign-in: a phone number, as typed. */
export const createMemberSessionBodySchema = z.object({
	phone: z.string().trim().min(1, "Phone number is required").openapi({
		description:
			"Phone number in any accepted format; normalized to E.164 by the server before matching a Member.",
		example: "9123 4567",
	}),
});
export type CreateMemberSessionBody = z.infer<
	typeof createMemberSessionBodySchema
>;
