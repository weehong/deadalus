import type { Request, Response } from "express";

import { HttpError } from "@/lib/http-error.js";
import type { AuthenticatedUser } from "@/services/auth.service.js";
import type { ApiResponse } from "@/types/api.js";

/**
 * GET /api/v1/me — the identity behind the bearer token. `requireAuth` has
 * already verified the token and attached the user; the guard here only
 * protects against the route being mounted without the middleware.
 */
export function meController(
	request: Request,
	response: Response<ApiResponse<AuthenticatedUser>>
): void {
	if (!request.user) {
		throw HttpError.unauthorized();
	}

	response.status(200).json({ data: request.user });
}
