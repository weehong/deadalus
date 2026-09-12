import type { Request, Response } from "express";
import type { UnitItem } from "@/schemas/unit-items.schema.js";
import { readUnitItems } from "@/services/unit-items.service.js";
import type { ApiResponse } from "@/types/api.js";
export async function readUnitItemsController(
	request: Request<{ id: string; unitId: string }>,
	response: Response<ApiResponse<Array<UnitItem>>>
): Promise<void> {
	response.status(200).json({
		data: await readUnitItems(request.params.id, request.params.unitId),
	});
}
