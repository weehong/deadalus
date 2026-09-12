import type { Request, Response } from "express";
import {
	addStoreys,
	renameStorey,
	deleteStorey,
} from "@/services/storeys.service.js";
export async function addStoreysController(
	request: Request<
		{ id: string; blockId: string },
		unknown,
		{ names: Array<string> }
	>,
	response: Response
): Promise<void> {
	response.status(201).json({
		data: await addStoreys(
			request.params.id,
			request.params.blockId,
			request.body.names
		),
	});
}
export async function renameStoreyController(
	request: Request<{ id: string; storeyId: string }, unknown, { name: string }>,
	response: Response
): Promise<void> {
	response.json({
		data: await renameStorey(
			request.params.id,
			request.params.storeyId,
			request.body.name
		),
	});
}
export async function deleteStoreyController(
	request: Request<{ id: string; storeyId: string }>,
	response: Response
): Promise<void> {
	await deleteStorey(request.params.id, request.params.storeyId);
	response.sendStatus(204);
}
