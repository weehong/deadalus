import type { NextFunction, Request, Response } from "express";

import { HttpError } from "@/lib/http-error.js";
import {
	loadMember,
	verifyMemberToken,
} from "@/services/member-auth.service.js";

const BEARER_PREFIX = /^Bearer\s+(?<token>\S+)$/i;

/**
 * Require a verified Member token in the `Authorization` header and load the
 * Member it names. On success the Member, with its Subcontractor, is attached
 * as `request.member` so Field handlers derive the Subcontractor from it and
 * never from the request (ADR-0003). A missing, invalid, expired or
 * wrong-audience token, a Supabase token, or a Member that no longer exists
 * all become a 401 for the central error handler.
 */
export function requireMember(
	request: Request,
	_response: Response,
	next: NextFunction
): Promise<void> {
	const header = request.header("authorization");
	const token = header ? BEARER_PREFIX.exec(header)?.groups?.["token"] : null;

	if (!token) {
		throw HttpError.unauthorized("Missing bearer token");
	}

	return verifyMemberToken(token)
		.then(loadMember)
		.then((member) => {
			if (!member) {
				throw HttpError.unauthorized("Member no longer exists");
			}
			request.member = member;
			next();
		});
}
