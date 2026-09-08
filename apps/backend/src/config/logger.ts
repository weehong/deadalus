import { pino } from "pino";

import { env, isDevelopment } from "@/config/env.js";

/**
 * Application logger. In development it pretty-prints via `pino-pretty`; in
 * every other environment it emits structured JSON suitable for log shippers.
 */
export const logger = pino({
	level: env.LOG_LEVEL,
	...(isDevelopment
		? {
				transport: {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "SYS:standard",
						ignore: "pid,hostname",
					},
				},
			}
		: {}),
});

export type Logger = typeof logger;
