import type { UnitBatchInput } from "@/features/projects/UnitBatchForm";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	addUnits,
	editUnit,
	deleteUnit,
	type UnitEditInput,
} from "@/features/projects/units-api";
import type { Project } from "@/features/projects/types";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
export const useUnitMutations = (
	id: string,
	blockId: string | undefined
): {
	add: ReturnType<typeof useMutation<Project, Error, UnitBatchInput>>;
	edit: ReturnType<
		typeof useMutation<Project, Error, { unitId: string; body: UnitEditInput }>
	>;
	remove: ReturnType<typeof useMutation<void, Error, string>>;
} => {
	const client = useQueryClient();
	const key = [...PROJECTS_KEY, "detail", id];
	const update = async (project: Project): Promise<void> => {
		client.setQueryData(key, project);
		await client.invalidateQueries({ queryKey: [...PROJECTS_KEY, "list"] });
	};
	return {
		add: useMutation({
			mutationFn: (body: UnitBatchInput) => addUnits(id, blockId!, body),
			onSuccess: update,
		}),
		edit: useMutation({
			mutationFn: ({ unitId, body }: { unitId: string; body: UnitEditInput }) =>
				editUnit(id, unitId, body),
			onSuccess: update,
		}),
		remove: useMutation({
			mutationFn: (unitId: string) => deleteUnit(id, unitId),
			onSuccess: async (): Promise<void> => {
				await client.invalidateQueries({ queryKey: PROJECTS_KEY });
			},
		}),
	};
};
