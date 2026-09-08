import { PrismaClient } from "@prisma/client";

import { env, isProduction } from "@/config/env.js";

/**
 * Prisma client singleton. In development the module can be re-evaluated by the
 * `tsx watch` reloader, so the instance is cached on `globalThis` to avoid
 * exhausting the database connection pool with duplicate clients.
 */
const globalForPrisma = globalThis as typeof globalThis & {
	prisma?: PrismaClient;
};

export const prisma: PrismaClient =
	globalForPrisma.prisma ??
	new PrismaClient({
		// Use the validated connection string rather than whatever Prisma reads
		// from the ambient environment.
		datasourceUrl: env.DATABASE_URL,
		log: isProduction ? ["error"] : ["error", "warn"],
	});

if (!isProduction) {
	globalForPrisma.prisma = prisma;
}
