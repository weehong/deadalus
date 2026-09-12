import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { ProgressEntry } from "@/common/items";
import { fetchProgressEntries } from "@/features/projects/progressEntriesApi";
import { projectKey } from "@/features/projects/useProjectQuery";
/** Cached per Item under the Project; a new entry invalidates it. */
export const progressEntriesKey = (
	projectId: string,
	itemId: string
): readonly ["projects", "detail", string, "items", string, "entries"] => [
	...projectKey(projectId),
	"items",
	itemId,
	"entries",
];
/** An Item's history, read only while its History disclosure is open. */
export const useProgressEntriesQuery = (
	projectId: string,
	itemId: string,
	enabled = true
): UseQueryResult<Array<ProgressEntry>, Error> =>
	useQuery({
		queryKey: progressEntriesKey(projectId, itemId),
		queryFn: (): Promise<Array<ProgressEntry>> =>
			fetchProgressEntries(projectId, itemId),
		enabled,
		retry: false,
	});
