import {
	addUnitType,
	editUnitType,
	deleteUnitType,
} from "@/services/unit-types.service.js";
import { readProject } from "@/services/project-read.js";
import type { Project } from "@/schemas/project-detail.schema.js";
import type { Request, Response } from "express";
import type {
	CreateProjectBody,
	AddUnitTypeBody,
	EditUnitTypeBody,
	EditProjectBody,
	ListProjectsQuery,
} from "@/schemas/projects.schema.js";
import {
	createProject,
	editProject,
	deleteProject,
	listProjects,
	type ProjectRow,
} from "@/services/projects.service.js";
import type { ApiResponse } from "@/types/api.js";
export async function listProjectsController(
	request: Request,
	response: Response<ApiResponse<Array<ProjectRow>>>
): Promise<void> {
	const query = request.query as unknown as ListProjectsQuery;
	const { rows, total } = await listProjects(query);
	response.status(200).json({
		data: rows,
		meta: { page: query.page, pageSize: query.pageSize, total },
	});
}

export async function createProjectController(
	request: Request<
		Record<string, string>,
		ApiResponse<Project>,
		CreateProjectBody
	>,
	response: Response<ApiResponse<Project>>
): Promise<void> {
	response.status(201).json({ data: await createProject(request.body) });
}

export async function readProjectController(
	request: Request,
	response: Response<ApiResponse<Project>>
): Promise<void> {
	response
		.status(200)
		.json({ data: await readProject(request.params["id"] as string) });
}

export async function editProjectController(
	request: Request<
		Record<string, string>,
		ApiResponse<Project>,
		EditProjectBody
	>,
	response: Response<ApiResponse<Project>>
): Promise<void> {
	response.status(200).json({
		data: await editProject(request.params["id"] as string, request.body),
	});
}

export async function deleteProjectController(
	request: Request,
	response: Response
): Promise<void> {
	await deleteProject(request.params["id"] as string);
	response.status(204).send();
}

export async function addUnitTypeController(
	request: Request<{ id: string }, ApiResponse<Project>, AddUnitTypeBody>,
	response: Response<ApiResponse<Project>>
): Promise<void> {
	response
		.status(201)
		.json({ data: await addUnitType(request.params.id, request.body) });
}
export async function editUnitTypeController(
	request: Request<
		{ id: string; unitTypeId: string },
		ApiResponse<Project>,
		EditUnitTypeBody
	>,
	response: Response<ApiResponse<Project>>
): Promise<void> {
	response.status(200).json({
		data: await editUnitType(
			request.params.id,
			request.params.unitTypeId,
			request.body
		),
	});
}
export async function deleteUnitTypeController(
	request: Request<{ id: string; unitTypeId: string }>,
	response: Response
): Promise<void> {
	await deleteUnitType(request.params.id, request.params.unitTypeId);
	response.status(204).send();
}
