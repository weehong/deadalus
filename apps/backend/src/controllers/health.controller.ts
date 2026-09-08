import type { Request, Response } from "express";

import {
	getHealth,
	getReadiness,
	type HealthStatus,
	type ReadinessStatus,
} from "@/services/health.service.js";
import type { ApiResponse } from "@/types/api.js";

/** GET /health — liveness probe. */
export function healthController(
	_request: Request,
	response: Response<ApiResponse<HealthStatus>>
): void {
	response.status(200).json({ data: getHealth() });
}

/** GET /ready — readiness probe; 503 when a dependency is down. */
export async function readinessController(
	_request: Request,
	response: Response<ApiResponse<ReadinessStatus>>
): Promise<void> {
	const readiness = await getReadiness();
	const statusCode = readiness.status === "ready" ? 200 : 503;
	response.status(statusCode).json({ data: readiness });
}
