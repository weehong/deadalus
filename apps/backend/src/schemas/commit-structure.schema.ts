import { z } from "@/lib/zod.js";
import { nameKey } from "@/lib/name-key.js";
const name = z.string().trim().min(1).max(60);
function siblings<T extends { name: string }>(
	schema: z.ZodType<T>
): z.ZodArray<z.ZodType<T>> {
	return z.array(schema).superRefine((entries, context) => {
		const counts = new Map<string, number>();
		for (const entry of entries)
			counts.set(
				nameKey(entry.name),
				(counts.get(nameKey(entry.name)) ?? 0) + 1
			);
		const duplicates = entries
			.filter((entry) => (counts.get(nameKey(entry.name)) ?? 0) > 1)
			.map((entry) => entry.name);
		if (duplicates.length)
			context.addIssue({
				code: "custom",
				message: `Duplicate sibling names: ${duplicates.join(", ")}`,
			});
	});
}
const unit = z.object({
	name,
	unitTypeCode: z.string().trim().min(1).max(40).optional(),
});
const storey = z.object({ name, units: siblings(unit) });
const block = z.object({ name, storeys: siblings(storey) });
export const commitStructureBodySchema = z
	.object({ blocks: siblings(block).min(1).max(50) })
	.superRefine((body, context) => {
		const count = body.blocks.reduce(
			(total, entry) =>
				total + entry.storeys.reduce((sum, row) => sum + row.units.length, 0),
			0
		);
		if (count > 10_000)
			context.addIssue({
				code: "custom",
				path: ["blocks"],
				message: "At most 10,000 Units may be committed",
			});
	});
export type CommitStructureBody = z.infer<typeof commitStructureBodySchema>;
