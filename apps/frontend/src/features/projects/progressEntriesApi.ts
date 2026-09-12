import { apiFetch } from "@/common/api";
import type {
	ProgressEntry,
	ProgressEntryInput,
	UnitItem,
} from "@/common/items";

const path = (projectId: string, itemId: string): string =>
	`/api/v1/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/entries`;

/** Enter progress on an Item; answers with its Unit's Items, the Item's Progression now the value. */
export const enterProgress = (
	projectId: string,
	itemId: string,
	input: ProgressEntryInput
): Promise<Array<UnitItem>> =>
	apiFetch<Array<UnitItem>>(path(projectId, itemId), {
		method: "POST",
		body: JSON.stringify(input),
	});

/** An Item's history, newest first. */
export const fetchProgressEntries = (
	projectId: string,
	itemId: string
): Promise<Array<ProgressEntry>> =>
	apiFetch<Array<ProgressEntry>>(path(projectId, itemId));
