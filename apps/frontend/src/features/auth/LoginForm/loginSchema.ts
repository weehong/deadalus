import { z } from "zod";

/**
 * Shape only: a well-formed address and a non-empty password. No length or
 * complexity rule at sign-in — that would disclose the policy and lock out
 * anyone whose password predates it. Policy belongs at password-set time.
 * Messages are translation keys under `auth.validation`.
 */
export const loginSchema = z.object({
	email: z.string().trim().min(1, "emailRequired").email("emailInvalid"),
	password: z.string().min(1, "passwordRequired"),
});

export type LoginValues = z.infer<typeof loginSchema>;
