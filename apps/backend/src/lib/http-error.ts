/**
 * Application error carrying an HTTP status code and a machine-readable code.
 * Throw this from anywhere in the request lifecycle; the central error handler
 * translates it into the JSON error envelope. Extends the built-in `Error` so
 * stack traces and `instanceof` checks work as expected.
 */
export class HttpError extends Error {
	public readonly statusCode: number;
	public readonly code: string;
	public readonly details?: unknown;

	public constructor(
		statusCode: number,
		message: string,
		options?: { code?: string; details?: unknown; cause?: unknown }
	) {
		super(message, { cause: options?.cause });
		this.name = "HttpError";
		this.statusCode = statusCode;
		this.code = options?.code ?? "ERROR";
		this.details = options?.details;
	}

	public static badRequest(message: string, details?: unknown): HttpError {
		return new HttpError(400, message, { code: "BAD_REQUEST", details });
	}

	public static unauthorized(message = "Unauthorized"): HttpError {
		return new HttpError(401, message, { code: "UNAUTHORIZED" });
	}

	public static forbidden(message = "Forbidden"): HttpError {
		return new HttpError(403, message, { code: "FORBIDDEN" });
	}

	public static notFound(message = "Resource not found"): HttpError {
		return new HttpError(404, message, { code: "NOT_FOUND" });
	}

	public static internal(message = "Internal server error"): HttpError {
		return new HttpError(500, message, { code: "INTERNAL_SERVER_ERROR" });
	}
}
