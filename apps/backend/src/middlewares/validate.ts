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

			// `req.query`/`req.params` are getter-only in Express 5, so we mutate
			// the existing object in place. Clear stale keys first — a plain
			// `Object.assign` would leave behind any field the schema removed.
			const target = request[key] as Record<string, unknown>;
			for (const existing of Object.keys(target)) {
				delete target[existing];
			}
			Object.assign(target, result.data);
		}

		next();
	};
}
