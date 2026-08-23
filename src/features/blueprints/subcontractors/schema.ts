/* eslint-disable camelcase -- provider-shaped form values */
import { z } from "zod";
import { SCOPE_CODES } from "./model";
export const subcontractorSchema = z.object({
	company_name: z.string().trim().min(1, "Company name is required"),
	trade: z.string().trim().min(1, "Trade is required"),
	contact_person: z.string(),
	phone: z.string(),
	email: z.union([
		z.literal(""),
		z.string().email("Enter a valid email address"),
	]),
	contract_reference: z.string(),
	default_scope_codes: z.array(z.enum(SCOPE_CODES)).default([]),
});
export type SubcontractorValues = z.infer<typeof subcontractorSchema>;
