import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { renameSubcontractor, type Subcontractor } from "./api";
import { SUBCONTRACTORS_KEY } from "./useSubcontractorsQuery";
export const useRenameSubcontractor = (
	id: string
): UseMutationResult<Subcontractor, Error, { name: string }> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: { name: string }): Promise<Subcontractor> =>
			renameSubcontractor(id, input),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({ queryKey: SUBCONTRACTORS_KEY });
		},
	});
};
