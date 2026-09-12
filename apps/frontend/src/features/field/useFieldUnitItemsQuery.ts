import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchFieldUnitItems } from "@/features/field/api";
import type { FieldUnitItems } from "@/features/field/types";
import { FIELD_KEY } from "@/features/field/useMemberQuery";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

/** Cached per Unit under the Member's token; a new entry replaces it outright. */
export const fieldUnitItemsKey = (
	token: string | null,
	unitId: string
): readonly ["field", "units", string | null, string, "items"] => [
	...FIELD_KEY,
	"units",
	token,
	unitId,
	"items",
];

/** One Unit as the Member's Subcontractor sees it: the heading and its Items there. */
export const useFieldUnitItemsQuery = (
	unitId: string
): UseQueryResult<FieldUnitItems, Error> => {
	const token = useMemberSessionStore((state) => state.session?.token ?? null);
	return useQuery({
		queryKey: fieldUnitItemsKey(token, unitId),
		queryFn: (): Promise<FieldUnitItems> => fetchFieldUnitItems(unitId),
		enabled: token !== null,
		retry: false,
	});
};
