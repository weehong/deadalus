import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationResult,
	type UseQueryResult,
} from "@tanstack/react-query";
import {
	createMatch,
	fetchMatches,
	type CreateMatchInput,
	type Match,
} from "@/features/example/api";

const MATCHES_KEY = ["matches"] as const;

export const useMatchesQuery = (): UseQueryResult<Array<Match>, Error> => {
	return useQuery({
		queryKey: MATCHES_KEY,
		queryFn: (): Promise<Array<Match>> => fetchMatches(),
	});
};

/**
 * Create a match, then refetch the list so the table and chart reflect the
 * server's copy of the row rather than an optimistic guess.
 */
export const useCreateMatchMutation = (): UseMutationResult<
	Match,
	Error,
	CreateMatchInput
> => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (input: CreateMatchInput): Promise<Match> => createMatch(input),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({ queryKey: MATCHES_KEY });
		},
	});
};
