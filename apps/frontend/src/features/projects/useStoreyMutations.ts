import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
	addStoreys,
	renameStorey,
	deleteStorey,
} from "@/features/projects/storeys-api";
import type { Project } from "@/features/projects/types";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
export const useStoreyMutations = (
	id: string,
	blockId: string | undefined
): {
	add: ReturnType<typeof useMutation<Project, Error, Array<string>>>;
	rename: ReturnType<
		typeof useMutation<Project, Error, { storeyId: string; name: string }>
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
			mutationFn: (names: Array<string>) => addStoreys(id, blockId!, names),
			onSuccess: update,
		}),
		rename: useMutation({
			mutationFn: ({ storeyId, name }: { storeyId: string; name: string }) =>
				renameStorey(id, storeyId, name),
			onSuccess: update,
		}),
		remove: useMutation({
			mutationFn: (storeyId: string) => deleteStorey(id, storeyId),
			onSuccess: async (): Promise<void> => {
				await client.invalidateQueries({ queryKey: PROJECTS_KEY });
			},
		}),
	};
};
