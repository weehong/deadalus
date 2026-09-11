import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	createSubcontractor,
	type CreateSubcontractorInput,
	type Subcontractor,
} from "./api";
import { SUBCONTRACTORS_KEY } from "./useSubcontractorsQuery";

export const useCreateSubcontractor = (): UseMutationResult<
	Subcontractor,
	Error,
	CreateSubcontractorInput
> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: createSubcontractor,
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({ queryKey: SUBCONTRACTORS_KEY });
		},
	});
};
