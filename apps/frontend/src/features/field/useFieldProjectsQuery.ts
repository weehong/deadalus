import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchFieldProjects } from "@/features/field/api";
import type { FieldProjectRow } from "@/features/field/types";
import { FIELD_KEY } from "@/features/field/useMemberQuery";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

/**
 * The Member's Projects. Keyed by token so one Member's work never shows
 * for the next Member to sign in on the same phone.
 */
export const useFieldProjectsQuery = (): UseQueryResult<
	Array<FieldProjectRow>,
	Error
> => {
	const token = useMemberSessionStore((state) => state.session?.token ?? null);
	return useQuery({
		queryKey: [...FIELD_KEY, "projects", token],
		queryFn: fetchFieldProjects,
		enabled: token !== null,
		retry: false,
	});
};
