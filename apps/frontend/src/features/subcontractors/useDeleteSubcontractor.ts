import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { deleteSubcontractor } from "./api";
import { SUBCONTRACTORS_KEY } from "./useSubcontractorsQuery";

export const useDeleteSubcontractor = (
	id: string
): UseMutationResult<void, Error, void> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (): Promise<void> => deleteSubcontractor(id),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({
				queryKey: SUBCONTRACTORS_KEY,
				refetchType: "none",
			});
			queryClient.removeQueries({
				queryKey: [...SUBCONTRACTORS_KEY, "detail", id],
				exact: true,
			});
		},
	});
};
