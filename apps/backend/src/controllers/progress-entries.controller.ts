import type { Request, Response } from "express";
import { HttpError } from "@/lib/http-error.js";
import type {
	ProgressEntry,
	ProgressEntryBody,
} from "@/schemas/progress-entries.schema.js";
import type { UnitItem } from "@/schemas/unit-items.schema.js";
import {
	enterConsoleProgress,
	readProgressEntries,
} from "@/services/progress-entries.service.js";
import type { ApiResponse } from "@/types/api.js";
export async function enterProgressController(
	request: Request<
		{ id: string; itemId: string },
		ApiResponse<Array<UnitItem>>,
		ProgressEntryBody
	>,
	response: Response<ApiResponse<Array<UnitItem>>>
): Promise<void> {
	// `requireAuth` attached the Administrator; the guard only covers the route
	// being mounted without it.
	if (!request.user) throw HttpError.unauthorized();
	response.status(201).json({
		data: await enterConsoleProgress(
			request.params.id,
			request.params.itemId,
			request.body,
			request.user
		),
	});
}
export async function readProgressEntriesController(
	request: Request<{ id: string; itemId: string }>,
	response: Response<ApiResponse<Array<ProgressEntry>>>
): Promise<void> {
	response.status(200).json({
		data: await readProgressEntries(
			{ projectId: request.params.id },
			request.params.itemId
		),
	});
}
