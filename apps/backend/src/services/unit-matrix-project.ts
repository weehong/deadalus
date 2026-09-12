import { prisma } from "@/lib/prisma.js";
import { HttpError } from "@/lib/http-error.js";
export async function requireMatrixProject(id: string): Promise<void> {
	if (
		!(await prisma.project.findUnique({ where: { id }, select: { id: true } }))
	)
		throw HttpError.notFound("Project not found");
}
