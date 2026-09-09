import type { NextFunction, Request, Response } from "express";

import { HttpError } from "@/lib/http-error.js";
import { verifyAccessToken } from "@/services/auth.service.js";

const BEARER_PREFIX = /^Bearer\s+(?<token>\S+)$/i;

/**
 * Require a verified Supabase access token in the `Authorization` header.
 * On success the identity is attached as `request.user` for downstream
 * handlers; otherwise a 401 is thrown for the central error handler.
 */
export function requireAuth(
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> {
	const header = request.header("authorization");
	const token = header ? BEARER_PREFIX.exec(header)?.groups?.["token"] : null;

	if (!token) {
		throw HttpError.unauthorized("Missing bearer token");
	}

	// Express 5 forwards a rejected promise to the central error handler, so a
	// failed verification becomes the 401 thrown by the service.
	return verifyAccessToken(token).then((user) => {
		request.user = user;
		next();
	});
}
