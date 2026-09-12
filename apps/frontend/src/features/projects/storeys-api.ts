import { apiFetch, apiFetchVoid } from "@/common/api";
import type { Project } from "@/features/projects/types";
export const addStoreys = (
	id: string,
	blockId: string,
	names: Array<string>
): Promise<Project> =>
	apiFetch(
		`/api/v1/projects/${encodeURIComponent(id)}/blocks/${encodeURIComponent(blockId)}/storeys`,
		{
			method: "POST",
			body: JSON.stringify({ names }),
		}
	);
export const renameStorey = (
	id: string,
	storeyId: string,
	name: string
): Promise<Project> =>
	apiFetch(
		`/api/v1/projects/${encodeURIComponent(id)}/storeys/${encodeURIComponent(storeyId)}`,
		{ method: "PATCH", body: JSON.stringify({ name }) }
	);
export const deleteStorey = (id: string, storeyId: string): Promise<void> =>
	apiFetchVoid(
		`/api/v1/projects/${encodeURIComponent(id)}/storeys/${encodeURIComponent(storeyId)}`,
		{ method: "DELETE" }
	);
