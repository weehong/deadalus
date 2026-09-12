import type { Prisma } from "@prisma/client";

/**
 * How Items are reached. The Console reaches them through the Project in
 * the path; the Field through the Member's own Subcontractor, so an Item
 * assigned elsewhere, or not at all, does not exist for it (ADR-0003).
 */
export type ItemScope =
	{ readonly projectId: string } | { readonly subcontractorId: string };

/** The Items of one Project, whatever their Assignment. */
export const inProject = (projectId: string): Prisma.ItemWhereInput => ({
	unit: { storey: { block: { projectId } } },
});

/** The `where` narrowing an Item query to the scope; callers add the Unit or Item id. */
export const itemWhere = (scope: ItemScope): Prisma.ItemWhereInput =>
	"projectId" in scope
		? inProject(scope.projectId)
		: { subcontractorId: scope.subcontractorId };
