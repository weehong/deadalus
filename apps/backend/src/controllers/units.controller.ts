import type { Request, Response } from "express";
import type { AddUnitsBody, EditUnitBody } from "@/schemas/units.schema.js";
import { addUnits, editUnit, deleteUnit } from "@/services/units.service.js";
export async function addUnitsController(
	request: Request<{ id: string; blockId: string }, unknown, AddUnitsBody>,
	response: Response
): Promise<void> {
	response.status(201).json({
		data: await addUnits(
			request.params.id,
			request.params.blockId,
			request.body
		),
	});
}
export async function editUnitController(
	request: Request<{ id: string; unitId: string }, unknown, EditUnitBody>,
	response: Response
): Promise<void> {
	response.json({
		data: await editUnit(
			request.params.id,
			request.params.unitId,
			request.body
		),
	});
}
export async function deleteUnitController(
	request: Request<{ id: string; unitId: string }>,
	response: Response
): Promise<void> {
	await deleteUnit(request.params.id, request.params.unitId);
	response.sendStatus(204);
}
