import {
	addUnitsBodySchema,
	editUnitBodySchema,
	unitParametersSchema,
} from "@/schemas/units.schema.js";
import { commitStructureBodySchema } from "@/schemas/commit-structure.schema.js";
import { unitMatrixPreviewSchema } from "@/schemas/unit-matrix.schema.js";
import {
	addStoreysBodySchema,
	renameStoreyBodySchema,
	storeyParametersSchema,
	addBlocksBodySchema,
	renameBlockBodySchema,
	blockParametersSchema,
} from "@/schemas/structure.schema.js";
import {
	projectSchema,
	projectParametersSchema,
} from "@/schemas/project-detail.schema.js";
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

import {
	createProjectBodySchema,
	addUnitTypeBodySchema,
	editUnitTypeBodySchema,
	unitTypeParametersSchema,
	editProjectBodySchema,
	listProjectsQuerySchema,
} from "@/schemas/projects.schema.js";

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

const ProjectRowSchema = registry.register(
	"ProjectRow",
	z.object({
		id: z.string(),
		code: z.string(),
		name: z.string(),
		blockCount: z.number().int().min(0),
		storeyCount: z.number().int().min(0),
		unitCount: z.number().int().min(0),
	})
);
registry.registerPath({
	method: "get",
	path: "/api/v1/projects",
	summary: "List Projects",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: { query: listProjectsQuerySchema },
	responses: {
		200: {
			description:
				"Projects sorted by name key with descendant counts and page metadata. Page size is capped at 100.",
			content: {
				"application/json": {
					schema: z.object({
						data: z.array(ProjectRowSchema),
						meta: PaginationMetaSchema,
					}),
				},
			},
		},
		400: { description: "Invalid pagination." },
		401: { description: "The bearer token is missing, invalid, or expired." },
	},
});

const ProjectSchema = registry.register("Project", projectSchema);
registry.registerPath({
	method: "post",
	path: "/api/v1/projects",
	summary: "Create a Project",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			required: true,
			content: { "application/json": { schema: createProjectBodySchema } },
		},
	},
	responses: {
		201: {
			description: "The full created Project.",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		400: { description: "Invalid name or code, with field errors." },
		401: { description: "The bearer token is missing, invalid, or expired." },
		409: { description: "PROJECT_NAME_TAKEN or PROJECT_CODE_TAKEN." },
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/projects/{id}",
	summary: "Read a Project",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: { params: projectParametersSchema },
	responses: {
		200: {
			description:
				"The full Project, ordered by position then id; Unit Types by code key then id.",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		401: { description: "A verified bearer token is required." },
		404: { description: "Project not found." },
	},
});

registry.registerPath({
	method: "patch",
	path: "/api/v1/projects/{id}",
	summary: "Edit a Project",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: projectParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: editProjectBodySchema } },
		},
	},
	responses: {
		200: {
			description: "The full updated Project.",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		400: { description: "Provide at least one valid name or code." },
		401: { description: "Unauthorized." },
		404: { description: "Project not found." },
		409: { description: "PROJECT_NAME_TAKEN or PROJECT_CODE_TAKEN." },
	},
});
registry.registerPath({
	method: "delete",
	path: "/api/v1/projects/{id}",
	summary: "Delete a Project and its Structure and Unit Types",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: { params: projectParametersSchema },
	responses: {
		204: { description: "Project and descendants deleted." },
		401: { description: "Unauthorized." },
		404: { description: "Project not found." },
	},
});

for (const [method, body, status] of [
	["post", addBlocksBodySchema, 201],
	["patch", renameBlockBodySchema, 200],
	["delete", undefined, 204],
] as const) {
	registry.registerPath({
		method,
		path:
			method === "post"
				? "/api/v1/projects/{id}/blocks"
				: "/api/v1/projects/{id}/blocks/{blockId}",
		summary:
			method === "post"
				? "Add Blocks atomically in creation order"
				: method === "patch"
					? "Rename a Block"
					: "Delete a Block and its Storeys and Units",
		tags: ["Projects"],
		security: [{ bearerAuth: [] }],
		request: {
			params:
				method === "post" ? projectParametersSchema : blockParametersSchema,
			...(body
				? {
						body: {
							required: true,
							content: { "application/json": { schema: body } },
						},
					}
				: {}),
		},
		responses: {
			[status]: {
				description:
					method === "delete"
						? "Block and descendants deleted."
						: "Full Project.",
				...(method === "delete"
					? {}
					: {
							content: {
								"application/json": { schema: dataEnvelope(projectSchema) },
							},
						}),
			},
			400: {
				description: "Invalid names; batches contain 1 to 500 unique names.",
			},
			401: { description: "Missing or invalid Session." },
			404: { description: "Project or scoped Block not found." },
			409: {
				description: "BLOCK_NAME_TAKEN",
				content: {
					"application/json": {
						schema: z.object({
							error: z.object({
								code: z.literal("BLOCK_NAME_TAKEN"),
								message: z.string(),
								details: z.object({ names: z.array(z.string()) }),
							}),
						}),
					},
				},
			},
		},
	});
}

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{id}/unit-matrix/parse",
	summary: "Preview a Unit Matrix workbook without storing it",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: projectParametersSchema,
		body: {
			required: true,
			content: {
				"multipart/form-data": {
					schema: z.object({
						file: z.string().openapi({
							type: "string",
							format: "binary",
							description: "One .xls or .xlsx workbook, at most 10 MB.",
						}),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "Every workbook sheet, including sheets without Blocks.",
			content: {
				"application/json": { schema: dataEnvelope(unitMatrixPreviewSchema) },
			},
		},
		400: {
			description:
				"BAD_REQUEST for invalid upload; UNIT_MATRIX_UNREADABLE for an unreadable workbook.",
		},
		401: { description: "A verified Session is required." },
		404: { description: "Project not found." },
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{id}/unit-types",
	summary: "Add a Unit Type",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: projectParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: addUnitTypeBodySchema } },
		},
	},
	responses: {
		201: {
			description: "The full Project",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		400: { description: "Invalid code or description" },
		401: { description: "Unauthorized" },
		404: { description: "Project not found" },
		409: { description: "UNIT_TYPE_CODE_TAKEN" },
	},
});
registry.registerPath({
	method: "patch",
	path: "/api/v1/projects/{id}/unit-types/{unitTypeId}",
	summary: "Edit a Unit Type",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: unitTypeParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: editUnitTypeBodySchema } },
		},
	},
	responses: {
		200: {
			description: "The full Project",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		400: { description: "Invalid code or description" },
		401: { description: "Unauthorized" },
		404: { description: "Unit Type not found in this Project" },
		409: { description: "UNIT_TYPE_CODE_TAKEN" },
	},
});
registry.registerPath({
	method: "delete",
	path: "/api/v1/projects/{id}/unit-types/{unitTypeId}",
	summary: "Delete an unused Unit Type",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: { params: unitTypeParametersSchema },
	responses: {
		204: { description: "Deleted" },
		400: { description: "Invalid parameters" },
		401: { description: "Unauthorized" },
		404: { description: "Unit Type not found in this Project" },
		409: {
			description:
				"UNIT_TYPE_IN_USE; details.unitCount gives the current number of Units",
		},
	},
});

for (const [method, body, status] of [
	["post", addStoreysBodySchema, 201],
	["patch", renameStoreyBodySchema, 200],
	["delete", undefined, 204],
] as const) {
	registry.registerPath({
		method,
		path:
			method === "post"
				? "/api/v1/projects/{id}/blocks/{blockId}/storeys"
				: "/api/v1/projects/{id}/storeys/{storeyId}",
		summary:
			method === "post"
				? "Add Storeys atomically in creation order"
				: method === "patch"
					? "Rename a Storey"
					: "Delete a Storey and its Units",
		tags: ["Projects"],
		security: [{ bearerAuth: [] }],
		request: {
			params:
				method === "post" ? blockParametersSchema : storeyParametersSchema,
			...(body
				? {
						body: {
							required: true,
							content: { "application/json": { schema: body } },
						},
					}
				: {}),
		},
		responses: {
			[status]: {
				description:
					method === "delete"
						? "Storey and descendants deleted."
						: "Full Project.",
				...(method === "delete"
					? {}
					: {
							content: {
								"application/json": { schema: dataEnvelope(projectSchema) },
							},
						}),
			},
			400: {
				description: "Invalid names; batches contain 1 to 500 unique names.",
			},
			401: { description: "Missing or invalid Session." },
			404: { description: "Project or scoped Storey not found." },
			409: {
				description: "STOREY_NAME_TAKEN",
				content: {
					"application/json": {
						schema: z.object({
							error: z.object({
								code: z.literal("STOREY_NAME_TAKEN"),
								message: z.string(),
								details: z.object({ names: z.array(z.string()) }),
							}),
						}),
					},
				},
			},
		},
	});
}

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{id}/structure",
	summary: "Commit a Structure into an empty Project",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: projectParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: commitStructureBodySchema } },
		},
	},
	responses: {
		201: {
			description: "The full Project",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		400: {
			description: "Invalid structure; duplicate sibling names under details",
		},
		401: { description: "Unauthorized" },
		404: { description: "Project not found" },
		409: {
			description: "PROJECT_HAS_BLOCKS; details.blockCount gives the count",
		},
	},
});

for (const [method, body, status] of [
	["post", addUnitsBodySchema, 201],
	["patch", editUnitBodySchema, 200],
	["delete", undefined, 204],
] as const) {
	registry.registerPath({
		method,
		path:
			method === "post"
				? "/api/v1/projects/{id}/blocks/{blockId}/units"
				: "/api/v1/projects/{id}/units/{unitId}",
		summary:
			method === "post"
				? "Add Units atomically in creation order"
				: method === "patch"
					? "Edit a Unit name or Unit Type"
					: "Delete a Unit",
		tags: ["Projects"],
		security: [{ bearerAuth: [] }],
		request: {
			params: method === "post" ? blockParametersSchema : unitParametersSchema,
			...(body
				? {
						body: {
							required: true,
							content: { "application/json": { schema: body } },
						},
					}
				: {}),
		},
		responses: {
			[status]: {
				description: method === "delete" ? "Unit deleted." : "Full Project.",
				...(method === "delete"
					? {}
					: {
							content: {
								"application/json": { schema: dataEnvelope(projectSchema) },
							},
						}),
			},
			400: {
				description:
					"Invalid names, 1 to 200 unique Storeys, 1 to 500 unique names; product at most 2000.",
			},
			401: { description: "Missing or invalid Session." },
			404: {
				description:
					"Project, Block, Storey, Unit or Unit Type not found in scope.",
			},
			409: {
				description: "UNIT_NAME_TAKEN",
				content: {
					"application/json": {
						schema: z.object({
							error: z.object({
								code: z.literal("UNIT_NAME_TAKEN"),
								message: z.string(),
								details: z.object({ names: z.array(z.string()) }),
							}),
						}),
					},
				},
			},
		},
	});
}
