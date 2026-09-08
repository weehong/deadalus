import { APP_VERSION } from "@/config/version.js";
import { prisma } from "@/lib/prisma.js";

export interface HealthStatus {
	readonly status: "ok";
	readonly uptime: number;
	readonly timestamp: string;
	readonly version: string;
}

export interface ReadinessStatus {
	readonly status: "ready" | "not_ready";
	readonly checks: {
		readonly database: "up" | "down";
	};
}

/** Liveness: the process is up and serving. Cheap and dependency-free. */
export function getHealth(): HealthStatus {
	return {
		status: "ok",
		uptime: process.uptime(),
		timestamp: new Date().toISOString(),
		version: APP_VERSION,
	};
}

/** Readiness: the process can serve traffic, including its dependencies. */
export async function getReadiness(): Promise<ReadinessStatus> {
	let database: "up" | "down" = "up";

	try {
		await prisma.$queryRaw`SELECT 1`;
	} catch {
		database = "down";
	}

	return {
		status: database === "up" ? "ready" : "not_ready",
		checks: { database },
	};
}
