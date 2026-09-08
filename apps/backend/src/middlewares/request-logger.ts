import { randomUUID } from "node:crypto";

import { pinoHttp } from "pino-http";

import { logger } from "@/config/logger.js";

/**
 * Per-request structured logging. Assigns a request id (honouring an inbound
 * `x-request-id` header when present) and exposes a child logger as `req.log`.
 */
export const requestLogger = pinoHttp({
	logger,
	genReqId: (request, response) => {
		const headerId = request.headers["x-request-id"];
		const id =
			(Array.isArray(headerId) ? headerId[0] : headerId) ?? randomUUID();
		response.setHeader("x-request-id", id);
		return id;
	},
});
