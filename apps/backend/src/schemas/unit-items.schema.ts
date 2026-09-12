import { z } from "@/lib/zod.js";
/** The latest Progress entry of an Item, as the Unit card summarises it. */
export const latestEntrySchema = z
	.object({
		value: z.number().int().min(0).max(100),
		note: z.string().nullable(),
		enteredByName: z.string(),
		createdAt: z.string().datetime(),
	})
	.nullable()
	.openapi({
		description: "The Item's latest Progress entry; null when it has none",
	});
export type LatestEntry = z.infer<typeof latestEntrySchema>;
/**
 * One Item of a Unit as the Unit card reads it: its name (the Catalogue
 * Item's), its Assignment, its stored Progression and its latest entry.
 * Ordered by name key.
 */
export const unitItemSchema = z.object({
	id: z.string(),
	catalogueItemId: z.string(),
	name: z.string(),
	subcontractor: z
		.object({ id: z.string(), name: z.string() })
		.nullable()
		.openapi({ description: "The Item's Assignment; null when it has none" }),
	assignedAt: z.string().datetime().nullable(),
	progression: z.number().int().min(0).max(100),
	latestEntry: latestEntrySchema,
});
export type UnitItem = z.infer<typeof unitItemSchema>;
