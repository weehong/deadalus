import {
	json,
	type RequestHandler,
	type Request,
	type Response,
} from "express";
import { HttpError } from "@/lib/http-error.js";
import type { CommitStructureBody } from "@/schemas/commit-structure.schema.js";
import { commitStructure } from "@/services/commit-structure.js";
export async function commitStructureController(
	request: Request<{ id: string }, unknown, CommitStructureBody>,
	response: Response
): Promise<void> {
	response
		.status(201)
		.json({ data: await commitStructure(request.params.id, request.body) });
}

const boundedJson = json({ limit: "8mb" });
export const parseStructureBody: RequestHandler = (
	request,
	response,
	next
): void => {
	boundedJson(request, response, (error?: unknown): void => {
		next(
			error ? HttpError.badRequest("Invalid Structure JSON body") : undefined
		);
	});
};
