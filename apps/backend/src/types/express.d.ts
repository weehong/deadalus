import type { Logger } from "@/config/logger.js";

// `pino-http` attaches a per-request id and child logger to the request object.
// Augment Express's types so handlers can read them without casts.
declare global {
	namespace Express {
		interface Request {
			id: string;
			log: Logger;
		}
	}
}

export {};
