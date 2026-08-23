export type StructureSearch = { id?: string; kind?: "storey" | "floor-plan" };
export const parseStructureSearch = (
	search: Record<string, unknown>
): StructureSearch => ({
	id: typeof search["id"] === "string" ? search["id"] : undefined,
	kind:
		search["kind"] === "storey" || search["kind"] === "floor-plan"
			? search["kind"]
			: undefined,
});
