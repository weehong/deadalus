import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { UnitItem } from "@/common/items";
import { fetchUnitItems } from "@/features/projects/unitItemsApi";
import { projectKey } from "@/features/projects/useProjectQuery";
/** Cached per Unit under the Project, so a Project write can invalidate every open Unit at once. */
export const unitItemsKey = (
	projectId: string,
	unitId: string
): readonly ["projects", "detail", string, "units", string, "items"] => [
	...projectKey(projectId),
	"units",
	unitId,
	"items",
];
export const useUnitItemsQuery = (
	projectId: string,
	unitId: string,
	enabled = true
): UseQueryResult<Array<UnitItem>, Error> =>
	useQuery({
		queryKey: unitItemsKey(projectId, unitId),
		queryFn: (): Promise<Array<UnitItem>> => fetchUnitItems(projectId, unitId),
		enabled,
		retry: false,
	});
