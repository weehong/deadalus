import { z } from "@/lib/zod.js";
/** A Progress entry as entered: a whole number from 0 to 100 and an optional short note. */
export const progressEntryBodySchema = z.object({
	value: z.number().int().min(0).max(100).openapi({
		description: "The Item's Progression after this entry, 0 to 100",
	}),
	note: z.string().trim().min(1).max(200).optional(),
});
export type ProgressEntryBody = z.infer<typeof progressEntryBodySchema>;
/** One entry of an Item's history: the value, who entered it and when. Never changed once made. */
export const progressEntrySchema = z.object({
	id: z.string(),
	value: z.number().int().min(0).max(100),
	note: z.string().nullable(),
	enteredByKind: z.enum(["administrator", "member"]),
	enteredByName: z.string().openapi({
		description:
			"The Administrator's email or the Member's name, as snapshotted",
	}),
	subcontractorName: z.string().nullable().openapi({
		description:
			"The Member's Subcontractor at the time; null for an Administrator",
	}),
	createdAt: z.string().datetime(),
});
export type ProgressEntry = z.infer<typeof progressEntrySchema>;
