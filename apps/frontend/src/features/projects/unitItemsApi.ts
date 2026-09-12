import { apiFetch } from "@/common/api";
import type { UnitItem } from "@/common/items";

export const fetchUnitItems = (
	projectId: string,
	unitId: string
): Promise<Array<UnitItem>> =>
	apiFetch<Array<UnitItem>>(
		`/api/v1/projects/${encodeURIComponent(projectId)}/units/${encodeURIComponent(unitId)}/items`
	);
