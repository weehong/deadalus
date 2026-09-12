import { z } from "@/lib/zod.js";

export const fieldProjectParametersSchema = z.object({ id: z.string().min(1) });

/** A Subcontractor's own count and Progression within one node of a Project. */
const subcontractorRollup = {
	itemCount: z.number().int().min(1).openapi({
		description: "The Member's Subcontractor's Items beneath this node",
	}),
	progression: z.number().min(0).max(100).openapi({
		description:
			"Average Progression of the Subcontractor's Items beneath this node; never null, as a node holding none is omitted",
	}),
};

/** One Project on the Field's list: the Subcontractor holds at least one Item in it. */
export const fieldProjectRowSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
	...subcontractorRollup,
});
export type FieldProjectRow = z.infer<typeof fieldProjectRowSchema>;

const fieldUnitSchema = z.object({
	id: z.string(),
	name: z.string(),
	...subcontractorRollup,
});
export type FieldUnit = z.infer<typeof fieldUnitSchema>;

const fieldStoreySchema = z.object({
	id: z.string(),
	name: z.string(),
	...subcontractorRollup,
	units: z.array(fieldUnitSchema),
});
export type FieldStorey = z.infer<typeof fieldStoreySchema>;

const fieldBlockSchema = z.object({
	id: z.string(),
	name: z.string(),
	...subcontractorRollup,
	storeys: z.array(fieldStoreySchema),
});
export type FieldBlock = z.infer<typeof fieldBlockSchema>;

/**
 * A Project as the Field walks it: Blocks, Storeys and Units in Structure
 * order, each rolled up over the Subcontractor's Items, with every node
 * holding none of them left out.
 */
export const fieldProjectSchema = z.object({
	id: z.string(),
	code: z.string(),
	name: z.string(),
	...subcontractorRollup,
	blocks: z.array(fieldBlockSchema),
});
export type FieldProject = z.infer<typeof fieldProjectSchema>;
