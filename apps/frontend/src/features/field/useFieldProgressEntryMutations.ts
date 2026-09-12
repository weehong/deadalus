import {
	useMutation,
	useQueryClient,
	type UseMutationResult,
} from "@tanstack/react-query";
import { enterFieldProgress } from "@/features/field/api";
import type { FieldUnitItems } from "@/features/field/types";
import { fieldProgressEntriesKey } from "@/features/field/useFieldProgressEntriesQuery";
import { fieldUnitItemsKey } from "@/features/field/useFieldUnitItemsQuery";
import { FIELD_KEY } from "@/features/field/useMemberQuery";
import { useMemberSessionStore } from "@/features/field/useMemberSessionStore";
import type { ProgressEntryInput } from "@/common/items";

export interface EnterFieldProgressInput extends ProgressEntryInput {
	itemId: string;
}

/**
 * Entering progress answers with the Unit as the Field reads it, which
 * replaces that cache so the Item updates in place; the Item's history and
 * every Field Project read (the list and each drill-down) are invalidated
 * so an open History refreshes and the Progression has moved on the way
 * back.
 */
export const useEnterFieldProgress = (
	unitId: string
): UseMutationResult<FieldUnitItems, Error, EnterFieldProgressInput> => {
	const client = useQueryClient();
	const token = useMemberSessionStore((state) => state.session?.token ?? null);
	return useMutation({
		mutationFn: ({ itemId, value, note }: EnterFieldProgressInput) =>
			enterFieldProgress(
				itemId,
				note === undefined ? { value } : { value, note }
			),
		onSuccess: async (unit, { itemId }): Promise<void> => {
			client.setQueryData(fieldUnitItemsKey(token, unitId), unit);
			await Promise.all([
				client.invalidateQueries({
					queryKey: fieldProgressEntriesKey(token, itemId),
				}),
				client.invalidateQueries({
					queryKey: [...FIELD_KEY, "projects", token],
				}),
			]);
		},
	});
};
