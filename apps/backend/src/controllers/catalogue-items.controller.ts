import type { Request, Response } from "express";
import type { Project } from "@/schemas/project-detail.schema.js";
import type { CatalogueItemBody } from "@/schemas/catalogue-items.schema.js";
import type {
	ApplyMeta,
	RemoveMeta,
	UnitSelectionBody,
} from "@/schemas/unit-selection.schema.js";
import {
	addCatalogueItem,
	renameCatalogueItem,
	deleteCatalogueItem,
	applyCatalogueItem,
	removeCatalogueItem,
} from "@/services/catalogue-items.service.js";
import type { ApiResponse } from "@/types/api.js";
export async function addCatalogueItemController(
	request: Request<{ id: string }, ApiResponse<Project>, CatalogueItemBody>,
	response: Response<ApiResponse<Project>>
): Promise<void> {
	response
		.status(201)
		.json({ data: await addCatalogueItem(request.params.id, request.body) });
}
export async function renameCatalogueItemController(
	request: Request<
		{ id: string; catalogueItemId: string },
		ApiResponse<Project>,
		CatalogueItemBody
	>,
	response: Response<ApiResponse<Project>>
): Promise<void> {
	response.status(200).json({
		data: await renameCatalogueItem(
			request.params.id,
			request.params.catalogueItemId,
			request.body
		),
	});
}
export async function deleteCatalogueItemController(
	request: Request<{ id: string; catalogueItemId: string }>,
	response: Response
): Promise<void> {
	await deleteCatalogueItem(request.params.id, request.params.catalogueItemId);
	response.status(204).send();
}
export async function applyCatalogueItemController(
	request: Request<
		{ id: string; catalogueItemId: string },
		ApiResponse<Project, ApplyMeta>,
		UnitSelectionBody
	>,
	response: Response<ApiResponse<Project, ApplyMeta>>
): Promise<void> {
	const { project, meta } = await applyCatalogueItem(
		request.params.id,
		request.params.catalogueItemId,
		request.body
	);
	response.status(201).json({ data: project, meta });
}
export async function removeCatalogueItemController(
	request: Request<
		{ id: string; catalogueItemId: string },
		ApiResponse<Project, RemoveMeta>,
		UnitSelectionBody
	>,
	response: Response<ApiResponse<Project, RemoveMeta>>
): Promise<void> {
	const { project, meta } = await removeCatalogueItem(
		request.params.id,
		request.params.catalogueItemId,
		request.body
	);
	response.status(200).json({ data: project, meta });
}
