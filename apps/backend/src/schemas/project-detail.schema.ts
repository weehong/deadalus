import { z } from "@/lib/zod.js";
export const projectParametersSchema = z.object({ id: z.string().min(1) });
/** Counts and the plain-average Progression of the Items beneath a node. */
const rollup = {
	itemCount: z.number().int().min(0),
	entryCount: z.number().int().min(0),
	progression: z.number().min(0).max(100).nullable().openapi({
		description:
			"Average Item Progression beneath this node; null with no Items",
	}),
};
const positioned = {
	id: z.string(),
	name: z.string(),
	position: z.number().int(),
	...rollup,
};
export const catalogueItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	itemCount: z.number().int().min(0),
});
export type CatalogueItem = z.infer<typeof catalogueItemSchema>;
/** One Item of a Unit, by ids and entry count; names and the entries themselves come from the Unit's Items read. */
export const unitItemSummarySchema = z.object({
	catalogueItemId: z.string(),
	subcontractorId: z.string().nullable().openapi({
		description: "The Item's Assignment; null when it has none",
	}),
	entryCount: z.number().int().min(0).openapi({
		description:
			"How many Progress entries the Item holds, so a remove can say exactly what goes with it",
	}),
});
export type UnitItemSummary = z.infer<typeof unitItemSummarySchema>;
export const projectSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
	...rollup,
	blocks: z.array(
		z.object({
			...positioned,
			storeys: z.array(
				z.object({
					...positioned,
					units: z.array(
						z.object({
							...positioned,
							unitTypeId: z.string().nullable(),
							items: z.array(unitItemSummarySchema).openapi({
								description:
									"The Unit's Items ordered by Catalogue Item id, so a selection preview is exact",
							}),
						})
					),
				})
			),
		})
	),
	unitTypes: z.array(
		z.object({
			id: z.string(),
			code: z.string(),
			description: z.string().nullable(),
			unitCount: z.number().int().min(0),
		})
	),
	catalogueItems: z.array(catalogueItemSchema),
});
export type Project = z.infer<typeof projectSchema>;
