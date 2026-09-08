import type { Request, Response } from "express";

import type { ApiError } from "@/types/api.js";

/**
 * Terminal handler for requests that matched no route. Mounted after all routes
 * and before the error handler.
 */
export function notFoundHandler(request: Request, response: Response): void {
	const body: ApiError = {
		error: {
			code: "NOT_FOUND",
			message: `Cannot ${request.method} ${request.path}`,
		},
	};
	response.status(404).json(body);
}
