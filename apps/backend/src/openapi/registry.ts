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
import {
	catalogueItemBodySchema,
	catalogueItemParametersSchema,
} from "@/schemas/catalogue-items.schema.js";
import {
	applyMetaSchema,
	removeMetaSchema,
	unitSelectionBodySchema,
} from "@/schemas/unit-selection.schema.js";
import {
	assignItemBodySchema,
	assignMetaSchema,
	bulkAssignBodySchema,
	itemParametersSchema,
} from "@/schemas/assignments.schema.js";
import { unitItemSchema } from "@/schemas/unit-items.schema.js";
import {
	progressEntryBodySchema,
	progressEntrySchema,
} from "@/schemas/progress-entries.schema.js";
import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

import { z } from "@/lib/zod.js";
import {
	fieldItemParametersSchema,
	fieldUnitItemsSchema,
	fieldUnitParametersSchema,
} from "@/schemas/field-items.schema.js";
import {
	fieldProjectParametersSchema,
	fieldProjectRowSchema,
	fieldProjectSchema,
} from "@/schemas/field-projects.schema.js";
import { createMemberSessionBodySchema } from "@/schemas/field.schema.js";
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
		409: {
			description:
				"SUBCONTRACTOR_HAS_ASSIGNMENTS: Items are still assigned to the Subcontractor; details.itemCount gives the current number.",
			content: {
				"application/json": {
					schema: z.object({
						error: z.object({
							code: z.literal("SUBCONTRACTOR_HAS_ASSIGNMENTS"),
							message: z.string(),
							details: z.object({ itemCount: z.number().int().min(0) }),
						}),
					}),
				},
			},
		},
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
		itemCount: z.number().int().min(0),
		progression: z.number().min(0).max(100).nullable().openapi({
			description:
				"Average Item Progression beneath the Project; null with no Items",
		}),
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
				"Projects sorted by name key with descendant counts, the Items roll-up and page metadata. Page size is capped at 100.",
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
				"The full Project, ordered by position then id; Unit Types by code key then id; Catalogue Items by name key then id. Every level carries itemCount, entryCount and progression (the plain average of the Items beneath it, null with none).",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		401: { description: "A verified bearer token is required." },
		404: { description: "Project not found." },
	},
});

registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{id}/catalogue-items",
	summary: "Add a Catalogue Item",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: projectParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: catalogueItemBodySchema } },
		},
	},
	responses: {
		201: {
			description: "The full Project",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		400: { description: "Invalid name (trimmed, 1 to 60 characters)" },
		401: { description: "Unauthorized" },
		404: { description: "Project not found" },
		409: {
			description:
				"CATALOGUE_ITEM_NAME_TAKEN; the name differs only by case or whitespace from an existing one",
		},
	},
});
registry.registerPath({
	method: "patch",
	path: "/api/v1/projects/{id}/catalogue-items/{catalogueItemId}",
	summary: "Rename a Catalogue Item and every Item made from it",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: catalogueItemParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: catalogueItemBodySchema } },
		},
	},
	responses: {
		200: {
			description: "The full Project",
			content: { "application/json": { schema: dataEnvelope(ProjectSchema) } },
		},
		400: { description: "Invalid name (trimmed, 1 to 60 characters)" },
		401: { description: "Unauthorized" },
		404: { description: "Catalogue Item not found in this Project" },
		409: { description: "CATALOGUE_ITEM_NAME_TAKEN" },
	},
});
registry.registerPath({
	method: "delete",
	path: "/api/v1/projects/{id}/catalogue-items/{catalogueItemId}",
	summary: "Delete a Catalogue Item no Unit holds",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: { params: catalogueItemParametersSchema },
	responses: {
		204: { description: "Deleted" },
		400: { description: "Invalid parameters" },
		401: { description: "Unauthorized" },
		404: { description: "Catalogue Item not found in this Project" },
		409: {
			description:
				"CATALOGUE_ITEM_IN_USE; details.itemCount gives the current number of Items made from it",
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{id}/catalogue-items/{catalogueItemId}/items",
	summary: "Apply a Catalogue Item to a set of Units",
	description:
		"Creates one Item at Progression 0 with no Assignment in every selected Unit that holds none made from this Catalogue Item. A Unit is selected when it matches every filter given; no filters selects every Unit of the Project. Units already holding one are skipped, so a repeat apply is safe.",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: catalogueItemParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: unitSelectionBodySchema } },
		},
	},
	responses: {
		201: {
			description: "The full Project with the counts of the bulk action",
			content: {
				"application/json": {
					schema: z.object({ data: ProjectSchema, meta: applyMetaSchema }),
				},
			},
		},
		400: { description: "A filter given as an empty array or malformed" },
		401: { description: "Unauthorized" },
		404: {
			description:
				"The Catalogue Item, or a Block, Storey or Unit Type in the selection, is not in this Project",
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{id}/catalogue-items/{catalogueItemId}/items/remove",
	summary: "Remove a Catalogue Item's Items from a set of Units",
	description:
		"Deletes the Item made from this Catalogue Item in every selected Unit that holds one, and by cascade every Progress entry those Items carried; the entries are counted inside the transaction before the delete. A Unit is selected when it matches every filter given; no filters selects every Unit of the Project. A selection holding none returns zeros.",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: catalogueItemParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: unitSelectionBodySchema } },
		},
	},
	responses: {
		200: {
			description: "The full Project with the counts of the bulk action",
			content: {
				"application/json": {
					schema: z.object({ data: ProjectSchema, meta: removeMetaSchema }),
				},
			},
		},
		400: { description: "A filter given as an empty array or malformed" },
		401: { description: "Unauthorized" },
		404: {
			description:
				"The Catalogue Item, or a Block, Storey or Unit Type in the selection, is not in this Project",
		},
	},
});

const UnitItemSchema = registry.register("UnitItem", unitItemSchema);
registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{id}/assignments",
	summary: "Assign a Catalogue Item's Items across a set of Units to one Subcontractor",
	description:
		"With a Subcontractor: assigns every selected unassigned Item made from the Catalogue Item and, with `reassign`, every Item assigned elsewhere too; Items already assigned to that Subcontractor are skipped. With `null`: unassigns every selected Item that has an Assignment. Neither touches an Item's Progression or its entries.",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: projectParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: bulkAssignBodySchema } },
		},
	},
	responses: {
		200: {
			description: "The full Project with the counts of the bulk action",
			content: {
				"application/json": {
					schema: z.object({ data: ProjectSchema, meta: assignMetaSchema }),
				},
			},
		},
		400: {
			description:
				"Missing Catalogue Item or Subcontractor, or a filter given as an empty array or malformed",
		},
		401: { description: "Unauthorized" },
		404: {
			description:
				"The Catalogue Item, or a Block, Storey or Unit Type in the selection, is not in this Project; or the Subcontractor does not exist",
		},
	},
});
registry.registerPath({
	method: "patch",
	path: "/api/v1/projects/{id}/items/{itemId}",
	summary: "Set, change or clear one Item's Assignment",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: itemParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: assignItemBodySchema } },
		},
	},
	responses: {
		200: {
			description: "The Unit's Items, ordered by name key",
			content: {
				"application/json": {
					schema: dataEnvelope(z.array(UnitItemSchema)),
				},
			},
		},
		400: { description: "subcontractorId must be a string or null" },
		401: { description: "Unauthorized" },
		404: {
			description:
				"The Item is not in this Project, or the Subcontractor does not exist",
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/api/v1/projects/{id}/units/{unitId}/items",
	summary: "Read a Unit's Items",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: { params: unitParametersSchema },
	responses: {
		200: {
			description:
				"The Unit's Items with name, Assignment, Progression and latest entry, ordered by name key",
			content: {
				"application/json": {
					schema: dataEnvelope(z.array(UnitItemSchema)),
				},
			},
		},
		401: { description: "Unauthorized" },
		404: { description: "Unit not found in this Project" },
	},
});
const ProgressEntrySchema = registry.register(
	"ProgressEntry",
	progressEntrySchema
);
registry.registerPath({
	method: "post",
	path: "/api/v1/projects/{id}/items/{itemId}/entries",
	summary: "Enter a Progress entry on an Item",
	description:
		"Appends an entry and sets the Item's stored Progression to its value in one transaction. The author is the Administrator behind the token. A later value may be lower than the last. An Item with no Assignment accepts none.",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: {
		params: itemParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: progressEntryBodySchema } },
		},
	},
	responses: {
		201: {
			description: "The Unit's Items, ordered by name key",
			content: {
				"application/json": {
					schema: dataEnvelope(z.array(UnitItemSchema)),
				},
			},
		},
		400: {
			description:
				"value must be a whole number from 0 to 100; note, when given, 1 to 200 characters",
		},
		401: { description: "Unauthorized" },
		404: { description: "The Item is not in this Project" },
		409: { description: "ITEM_UNASSIGNED: the Item has no Assignment" },
	},
});
registry.registerPath({
	method: "get",
	path: "/api/v1/projects/{id}/items/{itemId}/entries",
	summary: "Read an Item's Progress entries, newest first",
	tags: ["Projects"],
	security: [{ bearerAuth: [] }],
	request: { params: itemParametersSchema },
	responses: {
		200: {
			description: "The Item's history, newest first",
			content: {
				"application/json": {
					schema: dataEnvelope(z.array(ProgressEntrySchema)),
				},
			},
		},
		401: { description: "Unauthorized" },
		404: { description: "The Item is not in this Project" },
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

// ---------------------------------------------------------------------------
// The Field (Member routes, ADR-0009)
// ---------------------------------------------------------------------------

registry.registerComponent("securitySchemes", "memberBearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
	description:
		"A Member token issued by POST /api/v1/field/sessions. Never accepted by Console routes, which never accept a Supabase token here either.",
});

const FieldMemberSchema = registry.register(
	"FieldMember",
	z.object({
		id: z.string(),
		name: z.string(),
		subcontractor: z.object({ id: z.string(), name: z.string() }),
	})
);

const MemberSessionSchema = registry.register(
	"MemberSession",
	z.object({
		token: z.string().openapi({
			description:
				"HS256 JWT: issuer daedalus, audience field, subject the Member id, thirty-day expiry.",
		}),
		member: FieldMemberSchema,
	})
);

registry.registerPath({
	method: "post",
	path: "/api/v1/field/sessions",
	summary: "Sign a Member in to the Field by phone number",
	tags: ["Field"],
	request: {
		body: {
			content: {
				"application/json": { schema: createMemberSessionBodySchema },
			},
		},
	},
	responses: {
		200: {
			description: "The Member token and the Member with its Subcontractor.",
			content: {
				"application/json": { schema: dataEnvelope(MemberSessionSchema) },
			},
		},
		400: { description: "The phone number is blank." },
		404: {
			description:
				"MEMBER_NOT_FOUND: no Member holds this phone number, or it cannot be a phone number.",
		},
		429: { description: "Rate limited." },
	},
});

registry.registerPath({
	method: "get",
	path: "/api/v1/field/me",
	summary: "The signed-in Member",
	tags: ["Field"],
	security: [{ memberBearerAuth: [] }],
	responses: {
		200: {
			description: "The Member behind the token, with its Subcontractor.",
			content: {
				"application/json": { schema: dataEnvelope(FieldMemberSchema) },
			},
		},
		401: {
			description:
				"The Member token is missing, invalid, expired, for another audience, Supabase-signed, or names a Member that has been removed.",
		},
	},
});

const FieldProjectRowSchema = registry.register(
	"FieldProjectRow",
	fieldProjectRowSchema
);
registry.registerPath({
	method: "get",
	path: "/api/v1/field/projects",
	summary: "The Projects where the Member's Subcontractor holds Items",
	tags: ["Field"],
	security: [{ memberBearerAuth: [] }],
	responses: {
		200: {
			description:
				"Projects where the Subcontractor holds at least one Item, ordered by name key then id; itemCount and progression are over its Items alone. The Subcontractor is the Member's own, never one named by the request.",
			content: {
				"application/json": {
					schema: dataEnvelope(z.array(FieldProjectRowSchema)),
				},
			},
		},
		401: { description: "A verified Member token is required." },
	},
});

const FieldProjectSchema = registry.register("FieldProject", fieldProjectSchema);
registry.registerPath({
	method: "get",
	path: "/api/v1/field/projects/{id}",
	summary: "Walk a Project by Block, Storey and Unit",
	tags: ["Field"],
	security: [{ memberBearerAuth: [] }],
	request: { params: fieldProjectParametersSchema },
	responses: {
		200: {
			description:
				"The Project's Blocks, Storeys and Units in Structure order (position then id), each with the Subcontractor's own itemCount and progression; every node where it holds no Item is omitted.",
			content: {
				"application/json": { schema: dataEnvelope(FieldProjectSchema) },
			},
		},
		401: { description: "A verified Member token is required." },
		404: {
			description:
				"No such Project, or the Subcontractor holds nothing in it; the two are indistinguishable.",
		},
	},
});

const FieldUnitItemsSchema = registry.register(
	"FieldUnitItems",
	fieldUnitItemsSchema
);
registry.registerPath({
	method: "get",
	path: "/api/v1/field/units/{unitId}/items",
	summary: "Read a Unit's heading and the Subcontractor's Items there",
	tags: ["Field"],
	security: [{ memberBearerAuth: [] }],
	request: { params: fieldUnitParametersSchema },
	responses: {
		200: {
			description:
				"The Unit's Project, Block, Storey and name, and the Member's Subcontractor's Items in it (name, Assignment, Progression, latest entry), ordered by name key. The Subcontractor is the Member's own, never one named by the request.",
			content: {
				"application/json": { schema: dataEnvelope(FieldUnitItemsSchema) },
			},
		},
		401: { description: "A verified Member token is required." },
		404: {
			description:
				"No such Unit, or the Subcontractor holds nothing in it; the two are indistinguishable.",
		},
	},
});
registry.registerPath({
	method: "post",
	path: "/api/v1/field/items/{itemId}/entries",
	summary: "Enter a Progress entry on an Item as the Member",
	description:
		"Appends an entry and sets the Item's stored Progression to its value in one transaction, as the Console's route does. The author is the Member behind the token, with its Subcontractor's name snapshotted. A later value may be lower than the last.",
	tags: ["Field"],
	security: [{ memberBearerAuth: [] }],
	request: {
		params: fieldItemParametersSchema,
		body: {
			required: true,
			content: { "application/json": { schema: progressEntryBodySchema } },
		},
	},
	responses: {
		201: {
			description: "The Unit as the Field reads it, the Item's Progression now the value",
			content: {
				"application/json": { schema: dataEnvelope(FieldUnitItemsSchema) },
			},
		},
		400: {
			description:
				"value must be a whole number from 0 to 100; note, when given, 1 to 200 characters",
		},
		401: { description: "A verified Member token is required." },
		404: {
			description:
				"No such Item, or it is not assigned to the Member's Subcontractor (including an Item with no Assignment); the cases are indistinguishable.",
		},
	},
});
registry.registerPath({
	method: "get",
	path: "/api/v1/field/items/{itemId}/entries",
	summary: "Read an Item's Progress entries as the Member, newest first",
	tags: ["Field"],
	security: [{ memberBearerAuth: [] }],
	request: { params: fieldItemParametersSchema },
	responses: {
		200: {
			description: "The Item's history, newest first",
			content: {
				"application/json": {
					schema: dataEnvelope(z.array(ProgressEntrySchema)),
				},
			},
		},
		401: { description: "A verified Member token is required." },
		404: {
			description:
				"No such Item, or it is not assigned to the Member's Subcontractor; the cases are indistinguishable.",
		},
	},
});
