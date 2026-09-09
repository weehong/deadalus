import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { z } from "@/lib/zod.js";
import { createMatchBodySchema } from "@/schemas/matches.schema.js";

export const registry: OpenAPIRegistry = new OpenAPIRegistry();

const HealthSchema = registry.register(
	"HealthStatus",
	z.object({
		status: z.literal("ok"),
		uptime: z.number().openapi({ example: 12.34 }),
		timestamp: z.string().datetime(),
		version: z.string().openapi({ example: "0.0.0" }),
	})
);

const ReadinessSchema = registry.register(
	"ReadinessStatus",
	z.object({
		status: z.enum(["ready", "not_ready"]),
		checks: z.object({
			database: z.enum(["up", "down"]),
		}),
	})
);

function dataEnvelope(schema: z.ZodTypeAny): z.ZodTypeAny {
	return z.object({ data: schema });
}

registry.registerPath({
	method: "get",
	path: "/health",
	summary: "Liveness probe",
	tags: ["Health"],
	responses: {
		200: {
			description: "The service is up.",
			content: {
				"application/json": { schema: dataEnvelope(HealthSchema) },
			},
		},
	},
});

registry.registerPath({
	method: "get",
	path: "/ready",
	summary: "Readiness probe",
	tags: ["Health"],
	responses: {
		200: {
			description: "The service and its dependencies are ready.",
			content: {
				"application/json": { schema: dataEnvelope(ReadinessSchema) },
			},
		},
		503: {
			description: "A dependency is unavailable.",
			content: {
				"application/json": { schema: dataEnvelope(ReadinessSchema) },
			},
		},
	},
});

const MatchSchema = registry.register(
	"Match",
	z.object({
		id: z.string().openapi({ example: "seed-match-01" }),
		homeTeam: z.string().openapi({ example: "Lisbon" }),
		awayTeam: z.string().openapi({ example: "Porto" }),
		homeScore: z.number().int().openapi({ example: 2 }),
		awayScore: z.number().int().openapi({ example: 1 }),
		playedOn: z.string().datetime(),
	})
);

const CreateMatchSchema = registry.register(
	"CreateMatch",
	createMatchBodySchema
);

registry.registerPath({
	method: "get",
	path: "/api/v1/matches",
	summary: "List matches",
	tags: ["Matches"],
	responses: {
		200: {
			description: "All matches, most recently played first.",
			content: {
				"application/json": { schema: dataEnvelope(z.array(MatchSchema)) },
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/matches",
	summary: "Create a match",
	tags: ["Matches"],
	request: {
		body: {
			content: {
				"application/json": { schema: CreateMatchSchema },
			},
		},
	},
	responses: {
		201: {
			description: "The created match.",
			content: {
				"application/json": { schema: dataEnvelope(MatchSchema) },
			},
		},
		400: {
			description: "The request body failed validation.",
		},
	},
});

registry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description: "A Supabase access token.",
});

const MeSchema = registry.register(
	"Me",
	z.object({
		id: z
			.string()
			.uuid()
			.openapi({ example: "00000000-0000-4000-8000-000000000001" }),
		email: z.string().email().optional().openapi({
			example: "administrator@example.com",
		}),
	})
);

registry.registerPath({
	method: "get",
	path: "/api/v1/me",
	summary: "The signed-in identity",
	tags: ["Me"],
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: "The identity carried by the bearer token.",
			content: {
				"application/json": { schema: dataEnvelope(MeSchema) },
			},
		},
		401: {
			description: "The bearer token is missing, invalid, or expired.",
		},
	},
});
