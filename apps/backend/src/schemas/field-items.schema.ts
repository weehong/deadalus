import { z } from "@/lib/zod.js";
import { unitItemSchema } from "@/schemas/unit-items.schema.js";

export const fieldUnitParametersSchema = z.object({
	unitId: z.string().min(1),
});
export const fieldItemParametersSchema = z.object({
	itemId: z.string().min(1),
});

const named = z.object({ id: z.string(), name: z.string() });

/**
 * A Unit as the Field's Unit screen reads it: the heading (its Project,
 * Block and Storey, and the Unit itself) and the Subcontractor's Items
 * there in the Console's Item shape, ordered by name key. A Unit where the
 * Subcontractor holds nothing is not part of its Field, so this is never
 * empty.
 */
export const fieldUnitItemsSchema = z.object({
	project: z.object({ id: z.string(), code: z.string(), name: z.string() }),
	block: named,
	storey: named,
	unit: named,
	items: z.array(unitItemSchema).min(1).openapi({
		description:
			"The Member's Subcontractor's Items in this Unit, ordered by name key; never empty",
	}),
});
export type FieldUnitItems = z.infer<typeof fieldUnitItemsSchema>;
