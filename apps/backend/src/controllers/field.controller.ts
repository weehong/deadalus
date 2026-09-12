import type { Request, Response } from "express";

import { HttpError } from "@/lib/http-error.js";
import type { FieldUnitItems } from "@/schemas/field-items.schema.js";
import type {
	FieldProject,
	FieldProjectRow,
} from "@/schemas/field-projects.schema.js";
import type { CreateMemberSessionBody } from "@/schemas/field.schema.js";
import type {
	ProgressEntry,
	ProgressEntryBody,
} from "@/schemas/progress-entries.schema.js";
import {
	enterFieldProgress,
	readFieldProgressEntries,
	readFieldUnitItems,
} from "@/services/field-items.service.js";
import {
	listFieldProjects,
	readFieldProject,
} from "@/services/field-projects.service.js";
import {
	signInWithPhone,
	type MemberIdentity,
	type MemberSession,
} from "@/services/member-auth.service.js";
import type { ApiResponse } from "@/types/api.js";

/** The Member `requireMember` loaded; a route mounted without it is a 401, never a leak. */
function memberOf(request: Request): MemberIdentity {
	if (!request.member) throw HttpError.unauthorized();
	return request.member;
}

/** POST /api/v1/field/sessions — sign a Member in by phone number. */
export async function createMemberSessionController(
	request: Request<unknown, unknown, CreateMemberSessionBody>,
	response: Response<ApiResponse<MemberSession>>
): Promise<void> {
	const session = await signInWithPhone(request.body.phone);
	response.status(200).json({ data: session });
}

/**
 * GET /api/v1/field/me — the Member behind the bearer token. `requireMember`
 * has already verified the token and loaded the Member; the guard here only
 * protects against the route being mounted without the middleware.
 */
export function fieldMeController(
	request: Request,
	response: Response<ApiResponse<MemberIdentity>>
): void {
	response.status(200).json({ data: memberOf(request) });
}

/**
 * GET /api/v1/field/projects — the Projects where the Member's Subcontractor
 * holds Items. The Subcontractor comes from the loaded Member alone.
 */
export async function listFieldProjectsController(
	request: Request,
	response: Response<ApiResponse<Array<FieldProjectRow>>>
): Promise<void> {
	const { subcontractor } = memberOf(request);
	response
		.status(200)
		.json({ data: await listFieldProjects(subcontractor.id) });
}

/** GET /api/v1/field/projects/:id — one Project, as the Subcontractor's Members see it. */
export async function readFieldProjectController(
	request: Request<{ id: string }>,
	response: Response<ApiResponse<FieldProject>>
): Promise<void> {
	const { subcontractor } = memberOf(request);
	response.status(200).json({
		data: await readFieldProject(request.params.id, subcontractor.id),
	});
}

/** GET /api/v1/field/units/:unitId/items — the Unit's heading and the Subcontractor's Items there. */
export async function readFieldUnitItemsController(
	request: Request<{ unitId: string }>,
	response: Response<ApiResponse<FieldUnitItems>>
): Promise<void> {
	const { subcontractor } = memberOf(request);
	response.status(200).json({
		data: await readFieldUnitItems(request.params.unitId, subcontractor.id),
	});
}

/** POST /api/v1/field/items/:itemId/entries — a Member's Progress entry on one of its Subcontractor's Items. */
export async function enterFieldProgressController(
	request: Request<
		{ itemId: string },
		ApiResponse<FieldUnitItems>,
		ProgressEntryBody
	>,
	response: Response<ApiResponse<FieldUnitItems>>
): Promise<void> {
	const member = memberOf(request);
	response.status(201).json({
		data: await enterFieldProgress(request.params.itemId, request.body, member),
	});
}

/** GET /api/v1/field/items/:itemId/entries — the history of one of the Subcontractor's Items, newest first. */
export async function readFieldProgressEntriesController(
	request: Request<{ itemId: string }>,
	response: Response<ApiResponse<Array<ProgressEntry>>>
): Promise<void> {
	const { subcontractor } = memberOf(request);
	response.status(200).json({
		data: await readFieldProgressEntries(
			request.params.itemId,
			subcontractor.id
		),
	});
}
