import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { apiFetch } from "@/common/api";

/** The identity the API read from the bearer token. */
export interface Me {
	id: string;
	email?: string;
}

export const fetchMe = (): Promise<Me> => apiFetch<Me>("/api/v1/me");

export const meQueryKey = ["me"] as const;

export const useMeQuery = (): UseQueryResult<Me> =>
	useQuery({ queryKey: meQueryKey, queryFn: fetchMe, retry: false });
