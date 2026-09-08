import type { Server } from "node:http";

import { createApp } from "@/app.js";
import { env } from "@/config/env.js";
import { logger } from "@/config/logger.js";
import { prisma } from "@/lib/prisma.js";

const app = createApp();

const server: Server = app.listen(env.PORT, () => {
	logger.info(`Server listening on http://localhost:${String(env.PORT)}`);
	logger.info(
		`API docs available at http://localhost:${String(env.PORT)}/docs`
	);
});

/**
 * Drain in-flight requests, close the database connection, then exit. A hard
 * timeout guards against a connection that never finishes closing.
 */
let shuttingDown = false;

async function shutdown(signal: string): Promise<void> {
	// A second SIGTERM/SIGINT (or both firing) must not start a second drain.
	if (shuttingDown) {
		return;
	}
	shuttingDown = true;

	logger.info(`Received ${signal}, shutting down gracefully...`);

	const forceExit = setTimeout(() => {
		logger.error("Graceful shutdown timed out; forcing exit.");
		process.exit(1);
	}, 10_000);
	forceExit.unref();

	try {
		await new Promise<void>((resolve, reject) => {
			server.close((error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
		await prisma.$disconnect();
		logger.info("Shutdown complete.");
		process.exit(0);
	} catch (error) {
		logger.error({ err: error }, "Error during shutdown.");
		process.exit(1);
	}
}

for (const signal of ["SIGTERM", "SIGINT"] as const) {
	process.on(signal, () => {
		void shutdown(signal);
	});
}

process.on("unhandledRejection", (reason) => {
	logger.error({ err: reason }, "Unhandled promise rejection.");
});

process.on("uncaughtException", (error) => {
	logger.fatal({ err: error }, "Uncaught exception; exiting.");
	process.exit(1);
});
