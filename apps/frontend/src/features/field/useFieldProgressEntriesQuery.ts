import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchFieldProgressEntries } from "@/features/field/api";
import { FIELD_KEY } from "@/features/field/useMemberQuery";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";
import type { ProgressEntry } from "@/common/items";

/** Cached per Item under the Member's token; a new entry invalidates it. */
export const fieldProgressEntriesKey = (
	token: string | null,
	itemId: string
): readonly ["field", "items", string | null, string, "entries"] => [
	...FIELD_KEY,
	"items",
	token,
	itemId,
	"entries",
];

/** An Item's history, read only while its History disclosure is open. */
export const useFieldProgressEntriesQuery = (
	itemId: string,
	enabled = true
): UseQueryResult<Array<ProgressEntry>, Error> => {
	const token = useMemberSessionStore((state) => state.session?.token ?? null);
	return useQuery({
		queryKey: fieldProgressEntriesKey(token, itemId),
		queryFn: (): Promise<Array<ProgressEntry>> =>
			fetchFieldProgressEntries(itemId),
		enabled: enabled && token !== null,
		retry: false,
	});
};
