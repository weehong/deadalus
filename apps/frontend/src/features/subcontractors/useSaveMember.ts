import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import {
	addMember,
	editMember,
	type MemberInput,
	type Subcontractor,
} from "./api";
import { SUBCONTRACTORS_KEY } from "./useSubcontractorsQuery";
interface SaveMemberInput {
	memberId?: string;
	values: MemberInput;
}
export const useSaveMember = (
	id: string
): UseMutationResult<Subcontractor, Error, SaveMemberInput> => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			memberId,
			values,
		}: SaveMemberInput): Promise<Subcontractor> =>
			memberId ? editMember(id, memberId, values) : addMember(id, values),
		onSuccess: async (): Promise<void> => {
			await queryClient.invalidateQueries({ queryKey: SUBCONTRACTORS_KEY });
		},
	});
};
