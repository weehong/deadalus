import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { ZodTypeAny } from "zod";

import { HttpError } from "@/lib/http-error.js";

interface ValidationSchemas {
	readonly body?: ZodTypeAny;
	readonly query?: ZodTypeAny;
	readonly params?: ZodTypeAny;
}

/**
 * Build a middleware that validates the request `body`, `query`, and/or `params`
 * against the given zod schemas. Parsed (and coerced) values replace the raw
 * input so downstream handlers receive typed data. A failed parse becomes a 400
 * `HttpError` carrying the flattened field errors.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
	return (request: Request, _response: Response, next: NextFunction): void => {
		for (const key of ["body", "query", "params"] as const) {
			const schema = schemas[key];
			if (!schema) {
				continue;
			}

			const result = schema.safeParse(request[key]);
			if (!result.success) {
				next(
					HttpError.badRequest(`Invalid request ${key}`, result.error.flatten())
				);
				return;
			}

			if (key === "body") {
				// `req.body` is writable; replace it outright so fields stripped by
				// the schema don't survive on the request.
				// (Under zod 3 `result.data` was `any` and needed an `as unknown`
				// cast here; zod 4 types it properly, so the cast is redundant.)
				request.body = result.data;
				continue;
			}

			// Express 5's query getter parses a fresh object on every access.
			// Shadow it with the validated value so coercions and stripped keys
			// survive into controllers (the same replacement works for params).
			Object.defineProperty(request, key, {
				value: result.data,
				writable: true,
				enumerable: true,
				configurable: true,
			});
		}

		next();
	};
}
