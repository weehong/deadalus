import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { fetchFieldProject } from "@/features/field/api";
import type { FieldProject } from "@/features/field/types";
import { FIELD_KEY } from "@/features/field/useMemberQuery";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

/** One Project as the Member's Subcontractor sees it, keyed by token and Project id. */
export const useFieldProjectQuery = (
	id: string
): UseQueryResult<FieldProject, Error> => {
	const token = useMemberSessionStore((state) => state.session?.token ?? null);
	return useQuery({
		queryKey: [...FIELD_KEY, "projects", token, id],
		queryFn: (): Promise<FieldProject> => fetchFieldProject(id),
		enabled: token !== null,
		retry: false,
	});
};
