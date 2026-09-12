import { z } from "zod";

/** The phone is the whole credential; the API decides what it can be. */
export const fieldSignInSchema = z.object({
	phone: z.string().trim().min(1, "phoneRequired"),
});

export type FieldSignInValues = z.infer<typeof fieldSignInSchema>;
