import type { Request, Response } from "express";
import type { Project } from "@/schemas/project-detail.schema.js";
import type { UnitItem } from "@/schemas/unit-items.schema.js";
import type {
	AssignItemBody,
	AssignMeta,
	BulkAssignBody,
} from "@/schemas/assignments.schema.js";
import { assignItem, bulkAssign } from "@/services/assignments.service.js";
import type { ApiResponse } from "@/types/api.js";
export async function bulkAssignController(
	request: Request<
		{ id: string },
		ApiResponse<Project, AssignMeta>,
		BulkAssignBody
	>,
	response: Response<ApiResponse<Project, AssignMeta>>
): Promise<void> {
	const { project, meta } = await bulkAssign(request.params.id, request.body);
	response.status(200).json({ data: project, meta });
}
export async function assignItemController(
	request: Request<
		{ id: string; itemId: string },
		ApiResponse<Array<UnitItem>>,
		AssignItemBody
	>,
	response: Response<ApiResponse<Array<UnitItem>>>
): Promise<void> {
	response.status(200).json({
		data: await assignItem(
			request.params.id,
			request.params.itemId,
			request.body
		),
	});
}
