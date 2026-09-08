import type { Request, Response } from "express";

import {
	createMatch,
	listMatches,
	type Match,
} from "@/services/matches.service.js";
import type { CreateMatchBody } from "@/schemas/matches.schema.js";
import type { ApiResponse } from "@/types/api.js";

/** GET /api/v1/matches — list all matches. */
export async function listMatchesController(
	_request: Request,
	response: Response<ApiResponse<Array<Match>>>
): Promise<void> {
	response.status(200).json({ data: await listMatches() });
}

/**
 * POST /api/v1/matches — create a match. The body has already been validated
 * and coerced by the `validate` middleware, so it is safe to read directly.
 */
export async function createMatchController(
	request: Request,
	response: Response<ApiResponse<Match>>
): Promise<void> {
	const body = request.body as CreateMatchBody;
	response.status(201).json({ data: await createMatch(body) });
}
