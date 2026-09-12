import { apiFetch, apiFetchVoid } from "@/common/api";
import type { Project } from "@/features/projects/types";
export const addBlocks = (id: string, names: Array<string>): Promise<Project> =>
	apiFetch(`/api/v1/projects/${encodeURIComponent(id)}/blocks`, {
		method: "POST",
		body: JSON.stringify({ names }),
	});
export const renameBlock = (
	id: string,
	blockId: string,
	name: string
): Promise<Project> =>
	apiFetch(
		`/api/v1/projects/${encodeURIComponent(id)}/blocks/${encodeURIComponent(blockId)}`,
		{ method: "PATCH", body: JSON.stringify({ name }) }
	);
export const deleteBlock = (id: string, blockId: string): Promise<void> =>
	apiFetchVoid(
		`/api/v1/projects/${encodeURIComponent(id)}/blocks/${encodeURIComponent(blockId)}`,
		{ method: "DELETE" }
	);
