import type { Request, Response } from "express";
import type {
	ListSubcontractorsQuery,
	MemberBody,
	EditMemberBody,
	CreateSubcontractorBody,
	RenameSubcontractorBody,
} from "@/schemas/subcontractors.schema.js";
import {
	editMember,
	addMember,
	deleteSubcontractor,
	renameSubcontractor,
	listSubcontractors,
	removeMember,
	createSubcontractor,
	getSubcontractor,
	type Subcontractor,
	type SubcontractorRow,
} from "@/services/subcontractors.service.js";
import type { ApiResponse } from "@/types/api.js";

/** GET /api/v1/subcontractors — the paged Directory; the controller owns the envelope. */
export async function listSubcontractorsController(
	request: Request,
	response: Response<ApiResponse<Array<SubcontractorRow>>>
): Promise<void> {
	const query = request.query as unknown as ListSubcontractorsQuery;
	const { rows, total } = await listSubcontractors(query);
	response.status(200).json({
		data: rows,
		meta: { page: query.page, pageSize: query.pageSize, total },
	});
}

export async function getSubcontractorController(
	request: Request<{ id: string }>,
	response: Response<ApiResponse<Subcontractor>>
): Promise<void> {
	response
		.status(200)
		.json({ data: await getSubcontractor(request.params.id) });
}

export async function deleteSubcontractorController(
	request: Request<{ id: string }>,
	response: Response
): Promise<void> {
	await deleteSubcontractor(request.params.id);
	response.status(204).end();
}

export async function removeMemberController(
	request: Request<{ id: string; memberId: string }>,
	response: Response
): Promise<void> {
	await removeMember(request.params.id, request.params.memberId);
	response.status(204).end();
}

export async function createSubcontractorController(
	request: Request<
		Record<string, never>,
		ApiResponse<Subcontractor>,
		CreateSubcontractorBody
	>,
	response: Response<ApiResponse<Subcontractor>>
): Promise<void> {
	response.status(201).json({ data: await createSubcontractor(request.body) });
}

export async function renameSubcontractorController(
	request: Request<
		{ id: string },
		ApiResponse<Subcontractor>,
		RenameSubcontractorBody
	>,
	response: Response<ApiResponse<Subcontractor>>
): Promise<void> {
	response
		.status(200)
		.json({ data: await renameSubcontractor(request.params.id, request.body) });
}

export async function addMemberController(
	request: Request<{ id: string }, ApiResponse<Subcontractor>, MemberBody>,
	response: Response<ApiResponse<Subcontractor>>
): Promise<void> {
	response
		.status(201)
		.json({ data: await addMember(request.params.id, request.body) });
}

export async function editMemberController(
	request: Request<
		{ id: string; memberId: string },
		ApiResponse<Subcontractor>,
		EditMemberBody
	>,
	response: Response<ApiResponse<Subcontractor>>
): Promise<void> {
	response.status(200).json({
		data: await editMember(
			request.params.id,
			request.params.memberId,
			request.body
		),
	});
}
