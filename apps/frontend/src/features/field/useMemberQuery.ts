import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchMember } from "@/features/field/api";
import type { FieldMember } from "@/features/field/types";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";

export const FIELD_KEY = ["field"] as const;

/**
 * Re-read the Member behind the Session whenever the Field mounts, so a
 * renamed Member sees their new name and a removed one is signed out on that
 * first request (the fetch helper ends the Session on 401). Keyed by token so
 * one Member's answer never shows for the next.
 */
export const useMemberQuery = (): UseQueryResult<FieldMember, Error> => {
	const token = useMemberSessionStore((state) => state.session?.token ?? null);
	const update = useMemberSessionStore((state) => state.update);
	const query = useQuery({
		queryKey: [...FIELD_KEY, "me", token],
		queryFn: fetchMember,
		enabled: token !== null,
		retry: false,
	});
	useEffect(() => {
		if (query.data) update(query.data);
	}, [query.data, update]);
	return query;
};
