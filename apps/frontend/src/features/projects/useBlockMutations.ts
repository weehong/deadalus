import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addBlocks, renameBlock, deleteBlock } from "@/features/projects/blocks-api";
import type { Project } from "@/features/projects/types";
import { PROJECTS_KEY } from "@/features/projects/useProjectsQuery";
export const useBlockMutations = (
	id: string
): {
	add: ReturnType<typeof useMutation<Project, Error, Array<string>>>;
	rename: ReturnType<
		typeof useMutation<Project, Error, { blockId: string; name: string }>
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
			mutationFn: (names: Array<string>) => addBlocks(id, names),
			onSuccess: update,
		}),
		rename: useMutation({
			mutationFn: ({ blockId, name }: { blockId: string; name: string }) =>
				renameBlock(id, blockId, name),
			onSuccess: update,
		}),
		remove: useMutation({
			mutationFn: (blockId: string) => deleteBlock(id, blockId),
			onSuccess: async (): Promise<void> => {
				await client.invalidateQueries({ queryKey: PROJECTS_KEY });
			},
		}),
	};
};
