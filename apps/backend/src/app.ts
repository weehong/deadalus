import compression from "compression";
import cors from "cors";
import express, { type Application } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";

import { env } from "@/config/env.js";
import { errorHandler } from "@/middlewares/error-handler.js";
import { notFoundHandler } from "@/middlewares/not-found.js";
import { requestLogger } from "@/middlewares/request-logger.js";
import { buildOpenApiDocument } from "@/openapi/document.js";
import { apiRouter } from "@/routes/index.js";

function resolveCorsOrigin(): cors.CorsOptions["origin"] {
	if (env.CORS_ORIGIN === "*") {
		return "*";
	}
	return env.CORS_ORIGIN.split(",").map((origin) => origin.trim());
}

/**
 * Build and configure the Express application without binding a port. Keeping
 * `listen` out of this factory lets integration tests drive the app via
 * `supertest` while `server.ts` owns the real network lifecycle.
 */
export function createApp(): Application {
	const app = express();

	// Trust the first proxy hop so client IPs (used by the rate limiter) and
	// protocol are read from `x-forwarded-*` headers behind a load balancer.
	// Off by default; enable only when actually behind a trusted proxy.
	if (env.TRUST_PROXY) {
		app.set("trust proxy", 1);
	}

	// Security, parsing, and performance middleware.
	app.use(helmet());
	app.use(cors({ origin: resolveCorsOrigin() }));
	app.use(compression());
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(requestLogger);
	app.use(
		rateLimit({
			windowMs: env.RATE_LIMIT_WINDOW_MS,
			limit: env.RATE_LIMIT_MAX,
			standardHeaders: "draft-7",
			legacyHeaders: false,
			// Don't let health/readiness probes (often polled aggressively by
			// orchestrators) consume the rate-limit budget.
			skip: (request) =>
				request.path === "/health" || request.path === "/ready",
		})
	);

	// OpenAPI docs.
	const openApiDocument = buildOpenApiDocument();
	app.get("/openapi.json", (_request, response) => {
		response.json(openApiDocument);
	});
	app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

	// Application routes.
	app.use(apiRouter);

	// 404 then the central error handler (must be mounted last).
	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}
