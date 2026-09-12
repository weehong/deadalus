import type { Request, Response } from "express";
import {
	addBlocks,
	renameBlock,
	deleteBlock,
} from "@/services/blocks.service.js";
export async function addBlocksController(
	request: Request<{ id: string }, unknown, { names: Array<string> }>,
	response: Response
): Promise<void> {
	response
		.status(201)
		.json({ data: await addBlocks(request.params.id, request.body.names) });
}
export async function renameBlockController(
	request: Request<{ id: string; blockId: string }, unknown, { name: string }>,
	response: Response
): Promise<void> {
	response.json({
		data: await renameBlock(
			request.params.id,
			request.params.blockId,
			request.body.name
		),
	});
}
export async function deleteBlockController(
	request: Request<{ id: string; blockId: string }>,
	response: Response
): Promise<void> {
	await deleteBlock(request.params.id, request.params.blockId);
	response.sendStatus(204);
}
