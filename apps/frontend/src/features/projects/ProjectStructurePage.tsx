import { BlocksPane } from "@/features/projects/BlocksPane";
import { useBlockMutations } from "@/features/projects/useBlockMutations";
import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { StoreysPane } from "@/features/projects/StoreysPane";
import { useStoreyMutations } from "@/features/projects/useStoreyMutations";
import { UnitsPane } from "@/features/projects/UnitsPane";
import { useUnitMutations } from "@/features/projects/useUnitMutations";
import { useProjectQuery } from "@/features/projects/useProjectQuery";
export interface StructureSearch {
	imported?: boolean;
	importedOmitted?: Array<string>;
	importedTypes?: number;
	importedBlocks?: number;
	importedStoreys?: number;
	importedUnits?: number;
	block?: string;
	storey?: string;
}
export const ProjectStructurePage = ({
	id,
	search,
}: {
	id: string;
	search: StructureSearch;
}): React.ReactElement | null => {
	const { t } = useTranslation();
	const query = useProjectQuery(id);
	const navigate = useNavigate();
	const project = query.data;
	const mutations = useBlockMutations(id);
	const block =
		project?.blocks.find((entry) => entry.id === search.block) ??
		project?.blocks[0];
	const unitMutations = useUnitMutations(id, block?.id);
	const storeyMutations = useStoreyMutations(id, block?.id);
	const storey =
		block?.storeys.find((entry) => entry.id === search.storey) ??
		block?.storeys[0];
	useEffect(() => {
		if (project && (search.block !== block?.id || search.storey !== storey?.id))
			void navigate({
				to: "/projects/$id",
				params: { id },
				search: {
					imported: search.imported,
					importedOmitted: search.importedOmitted,
					importedTypes: search.importedTypes,
					importedBlocks: search.importedBlocks,
					importedStoreys: search.importedStoreys,
					importedUnits: search.importedUnits,
					block: block?.id,
					storey: storey?.id,
				},
				replace: true,
			});
	}, [
		project,
		search.imported,
		search.importedOmitted,
		search.importedTypes,
		search.importedBlocks,
		search.importedStoreys,
		search.importedUnits,
		search.block,
		search.storey,
		block?.id,
		storey?.id,
		id,
		navigate,
	]);
	if (!project) return null;
	return (
		<>
			{search.imported && search.importedOmitted?.length ? (
				<p role="status">
					{t("projects.upload.editor.omitted", {
						names: search.importedOmitted.join(", "),
					})}
				</p>
			) : null}
			{search.imported && (
				<p className="mb-4" role="status">
					{t("projects.upload.summary", {
						blocks: search.importedBlocks ?? 0,
						storeys: search.importedStoreys ?? 0,
						units: search.importedUnits ?? 0,
						types: search.importedTypes ?? 0,
					})}
				</p>
			)}
			<div className="mb-4 flex flex-wrap gap-3">
				{project.blocks.length > 0 ? (
					<>
						<button
							disabled
							aria-describedby="upload-disabled-hint"
							className="underline opacity-50"
							type="button"
						>
							{t("projects.upload.title")}
						</button>
						<span id="upload-disabled-hint">
							{t("projects.upload.hasBlocks", { count: project.blocks.length })}
						</span>
					</>
				) : (
					<Link className="underline" params={{ id }} to="/projects/$id/upload">
						{t("projects.upload.title")}
					</Link>
				)}
			</div>
			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<BlocksPane
					blocks={project.blocks}
					selectedId={block?.id}
					extraActions={
						project.blocks.length === 0 ? (
							<Link
								className="text-sm underline"
								params={{ id }}
								to="/projects/$id/upload"
							>
								{t("projects.upload.title")}
							</Link>
						) : undefined
					}
					pending={
						mutations.add.isPending ||
						mutations.rename.isPending ||
						mutations.remove.isPending
					}
					onAdd={(names): Promise<unknown> => mutations.add.mutateAsync(names)}
					onDelete={(blockId): Promise<unknown> =>
						mutations.remove.mutateAsync(blockId)
					}
					onRename={(blockId, name): Promise<unknown> =>
						mutations.rename.mutateAsync({ blockId, name })
					}
					onSelect={(blockId): void => {
						void navigate({
							to: "/projects/$id",
							params: { id },
							search: {
								...search,
								block: blockId,
								storey: project.blocks.find((entry) => entry.id === blockId)
									?.storeys[0]?.id,
							},
						});
					}}
				/>
				<StoreysPane
					key={block?.id ?? "no-block"}
					block={block}
					selectedId={storey?.id}
					pending={
						storeyMutations.add.isPending ||
						storeyMutations.rename.isPending ||
						storeyMutations.remove.isPending
					}
					onAdd={(names): Promise<unknown> =>
						storeyMutations.add.mutateAsync(names)
					}
					onDelete={(storeyId): Promise<unknown> =>
						storeyMutations.remove.mutateAsync(storeyId)
					}
					onRename={(storeyId, name): Promise<unknown> =>
						storeyMutations.rename.mutateAsync({ storeyId, name })
					}
					onSelect={(storeyId): void => {
						void navigate({
							to: "/projects/$id",
							params: { id },
							search: { ...search, block: block?.id, storey: storeyId },
						});
					}}
				/>
				<UnitsPane
					key={storey?.id ?? "no-storey"}
					block={block}
					storey={storey}
					unitTypes={project.unitTypes}
					pending={
						unitMutations.add.isPending ||
						unitMutations.edit.isPending ||
						unitMutations.remove.isPending
					}
					onAdd={(body) => unitMutations.add.mutateAsync(body)}
					onDelete={(unitId) => unitMutations.remove.mutateAsync(unitId)}
					onEdit={(unitId, body) =>
						unitMutations.edit.mutateAsync({ unitId, body })
					}
				/>
			</div>
		</>
	);
};
