import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { z } from "@/lib/zod.js";
import { createMatchBodySchema } from "@/schemas/matches.schema.js";
import {
	memberBodySchema,
	editMemberBodySchema,
	listSubcontractorsQuerySchema,
	createSubcontractorBodySchema,
	renameSubcontractorBodySchema,
	subcontractorParametersSchema,
	memberParametersSchema,
} from "@/schemas/subcontractors.schema.js";

export const registry: OpenAPIRegistry = new OpenAPIRegistry();

const PaginationMetaSchema = registry.register(
	"PaginationMeta",
	z.object({
		page: z.number().int().min(1),
		pageSize: z.number().int().min(1).max(100),
		total: z.number().int().min(0),
	})
);

const SubcontractorRowSchema = registry.register(
	"SubcontractorRow",
	z.object({
		id: z.string(),
		name: z.string(),
		memberCount: z.number().int().min(1),
		phones: z.array(z.string()),
	})
);

registry.registerPath({
	method: "get",
	path: "/api/v1/subcontractors",
	summary: "List the Directory",
	tags: ["Subcontractors"],
	security: [{ bearerAuth: [] }],
	request: { query: listSubcontractorsQuerySchema },
	responses: {
		200: {
			description:
				"Subcontractors sorted by name, with page metadata. Page size is capped at 100.",
			content: {
				"application/json": {
					schema: z.object({
						data: z.array(SubcontractorRowSchema),
						meta: PaginationMetaSchema,
					}),
				},
			},
		},
		400: { description: "Invalid pagination." },
		401: { description: "The bearer token is missing, invalid, or expired." },
	},
});

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

const MemberSchema = registry.register(
	"Member",
	z.object({ id: z.string(), name: z.string(), phone: z.string() })
);
const SubcontractorSchema = registry.register(
	"Subcontractor",
	z.object({ id: z.string(), name: z.string(), members: z.array(MemberSchema) })
);
registry.registerPath({
	method: "get",
	path: "/api/v1/subcontractors/{id}",
	summary: "Read a Subcontractor",
	tags: ["Subcontractors"],
	security: [{ bearerAuth: [] }],
	request: { params: subcontractorParametersSchema },
	responses: {
		200: {
			description:
				"The Subcontractor with its Members sorted by name then phone.",
			content: {
				"application/json": { schema: dataEnvelope(SubcontractorSchema) },
			},
		},
		401: { description: "The bearer token is missing, invalid, or expired." },
		404: { description: "The Subcontractor does not exist." },
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/subcontractors/{id}",
	summary: "Delete a Subcontractor and its Members",
	tags: ["Subcontractors"],
	security: [{ bearerAuth: [] }],
	request: { params: subcontractorParametersSchema },
	responses: {
		204: { description: "The Subcontractor and its Members were deleted." },
		401: { description: "The bearer token is missing, invalid, or expired." },
		404: { description: "The Subcontractor does not exist." },
	},
});

registry.registerPath({
	method: "delete",
	path: "/api/v1/subcontractors/{id}/members/{memberId}",
	summary: "Remove a Member",
	tags: ["Subcontractors"],
	security: [{ bearerAuth: [] }],
	request: { params: memberParametersSchema },
	responses: {
		204: { description: "The Member was removed." },
		401: { description: "The bearer token is missing, invalid, or expired." },
		404: { description: "The Member does not exist under this Subcontractor." },
		409: {
			description:
				"LAST_MEMBER: a Subcontractor must keep at least one Member.",
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.literal("LAST_MEMBER"),
							message: z.string(),
						}),
					}),
				},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/subcontractors",
	summary: "Create a Subcontractor with its first Member",
	tags: ["Subcontractors"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": { schema: createSubcontractorBodySchema },
			},
		},
	},
	responses: {
		201: {
			description: "The created Subcontractor and its first Member.",
			content: {
				"application/json": { schema: dataEnvelope(SubcontractorSchema) },
			},
		},
		400: {
			description:
				"A required name is blank or the phone cannot be normalized to E.164.",
		},
		401: { description: "The bearer token is missing, invalid, or expired." },
		409: {
			description:
				"SUBCONTRACTOR_NAME_TAKEN or MEMBER_PHONE_TAKEN; phone conflicts identify the existing Subcontractor.",
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.enum(["SUBCONTRACTOR_NAME_TAKEN", "MEMBER_PHONE_TAKEN"]),
							message: z.string(),
							details: z
								.object({
									subcontractorId: z.string(),
									subcontractorName: z.string(),
								})
								.optional(),
						}),
					}),
				},
			},
		},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/subcontractors/{id}",
	summary: "Rename a Subcontractor",
	tags: ["Subcontractors"],
	security: [{ bearerAuth: [] }],
	request: {
		params: subcontractorParametersSchema,
		body: {
			content: {
				"application/json": { schema: renameSubcontractorBodySchema },
			},
		},
	},
	responses: {
		200: {
			description: "The renamed Subcontractor with its Members.",
			content: {
				"application/json": { schema: dataEnvelope(SubcontractorSchema) },
			},
		},
		400: { description: "The Subcontractor name is missing or blank." },
		401: { description: "The bearer token is missing, invalid, or expired." },
		404: { description: "The Subcontractor does not exist." },
		409: {
			description:
				"SUBCONTRACTOR_NAME_TAKEN: another Subcontractor uses this normalized name.",
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.literal("SUBCONTRACTOR_NAME_TAKEN"),
							message: z.string(),
						}),
					}),
				},
			},
		},
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/subcontractors/{id}/members",
	summary: "Add a Member",
	tags: ["Subcontractors"],
	security: [{ bearerAuth: [] }],
	request: {
		params: subcontractorParametersSchema,
		body: { content: { "application/json": { schema: memberBodySchema } } },
	},
	responses: {
		201: {
			description:
				"The full Subcontractor with Members sorted by name then phone.",
			content: {
				"application/json": { schema: dataEnvelope(SubcontractorSchema) },
			},
		},
		400: {
			description:
				"Invalid Member input; edits require at least one of name or phone.",
		},
		401: { description: "The bearer token is missing, invalid, or expired." },
		404: {
			description:
				"The Subcontractor or Member does not exist under the supplied ids.",
		},
		409: {
			description:
				"MEMBER_PHONE_TAKEN identifies the Subcontractor holding this phone.",
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.literal("MEMBER_PHONE_TAKEN"),
							message: z.string(),
							details: z
								.object({
									subcontractorId: z.string(),
									subcontractorName: z.string(),
								})
								.optional(),
						}),
					}),
				},
			},
		},
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/subcontractors/{id}/members/{memberId}",
	summary: "Edit a Member",
	tags: ["Subcontractors"],
	security: [{ bearerAuth: [] }],
	request: {
		params: memberParametersSchema,
		body: { content: { "application/json": { schema: editMemberBodySchema } } },
	},
	responses: {
		200: {
			description:
				"The full Subcontractor with Members sorted by name then phone.",
			content: {
				"application/json": { schema: dataEnvelope(SubcontractorSchema) },
			},
		},
		400: {
			description:
				"Invalid Member input; edits require at least one of name or phone.",
		},
		401: { description: "The bearer token is missing, invalid, or expired." },
		404: {
			description:
				"The Subcontractor or Member does not exist under the supplied ids.",
		},
		409: {
			description:
				"MEMBER_PHONE_TAKEN identifies the Subcontractor holding this phone.",
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.literal("MEMBER_PHONE_TAKEN"),
							message: z.string(),
							details: z
								.object({
									subcontractorId: z.string(),
									subcontractorName: z.string(),
								})
								.optional(),
						}),
					}),
				},
			},
		},
	},
});
