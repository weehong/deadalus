import {
	useMutation,
	useQuery,
	useQueryClient,
	type UseMutationResult,
	type UseQueryResult,
} from "@tanstack/react-query";
import {
	fetchSubcontractors,
	fetchSubcontractor,
	removeMember,
	type Subcontractor,
	type DirectoryPage,
	type DirectoryParameters,
} from "./api";

export const SUBCONTRACTORS_KEY = ["subcontractors"] as const;

export const useSubcontractorsQuery = (
	parameters: DirectoryParameters,
	options: { enabled?: boolean } = {}
): UseQueryResult<DirectoryPage, Error> =>
	useQuery({
		queryKey: [...SUBCONTRACTORS_KEY, "list", parameters],
		queryFn: (): Promise<DirectoryPage> => fetchSubcontractors(parameters),
		enabled: options.enabled ?? true,
		retry: false,
	});

export const useSubcontractorQuery = (
	id: string
): UseQueryResult<Subcontractor, Error> =>
	useQuery({
		queryKey: [...SUBCONTRACTORS_KEY, "detail", id],
		queryFn: (): Promise<Subcontractor> => fetchSubcontractor(id),
		retry: false,
	});

export const useRemoveMember = (
	id: string
): UseMutationResult<void, Error, string> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (memberId: string): Promise<void> => removeMember(id, memberId),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({ queryKey: SUBCONTRACTORS_KEY });
		},
	});
};
