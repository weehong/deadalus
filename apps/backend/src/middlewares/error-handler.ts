import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { isProduction } from "@/config/env.js";
import { HttpError } from "@/lib/http-error.js";
import type { ApiError } from "@/types/api.js";

/**
 * Central error handler (mounted last). Express 5 forwards rejected promises
 * from async handlers here automatically, so route handlers can simply `throw`.
 * Maps known error shapes to status codes and returns the JSON error envelope;
 * unknown errors become a 500 with the message hidden in production.
 */
export function errorHandler(
	error: unknown,
	request: Request,
	response: Response,
	next: NextFunction
): void {
	// If the response has already started streaming, headers and status are
	// locked in — we can't send a JSON envelope. Defer to Express's default
	// handler, which closes the connection.
	if (response.headersSent) {
		next(error);
		return;
	}

	let statusCode = 500;
	let code = "INTERNAL_SERVER_ERROR";
	let message = "Internal server error";
	let details: unknown;

	if (error instanceof HttpError) {
		statusCode = error.statusCode;
		code = error.code;
		message = error.message;
		details = error.details;
	} else if (error instanceof ZodError) {
		statusCode = 400;
		code = "BAD_REQUEST";
		message = "Validation failed";
		details = error.flatten();
	} else if (error instanceof Error && !isProduction) {
		message = error.message;
	}

	if (statusCode >= 500) {
		request.log.error({ err: error }, "Unhandled request error");
	} else {
		request.log.warn({ err: error, code }, message);
	}

	const body: ApiError = {
		error: {
			code,
			message,
			...(details === undefined ? {} : { details }),
		},
	};

	response.status(statusCode).json(body);
}
