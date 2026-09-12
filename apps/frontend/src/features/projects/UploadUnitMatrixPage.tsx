import { useBlocker, useNavigate } from "@tanstack/react-router";
import { useCommitStructure } from "@/features/projects/useCommitStructure";
import { useProjectQuery } from "@/features/projects/useProjectQuery";
import {
	matrixToStructure,
	blockNameErrors,
	matrixErrors,
	omittedStoreys,
	type BlockSelection,
} from "@/features/projects/matrix-to-structure";
import type {
	UnitMatrixBlock,
	UnitMatrixPreview,
} from "@/features/projects/unitMatrixTypes";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ApiRequestError } from "@/common/api";
import { Button } from "@/components/ui/Button";
import { UnitMatrixAccordion } from "@/features/projects/UnitMatrixAccordion";
import { useParseUnitMatrix } from "@/features/projects/useParseUnitMatrix";
export const UploadUnitMatrixPage = ({
	id,
}: {
	id: string;
}): React.ReactElement => {
	const { t } = useTranslation();
	const parse = useParseUnitMatrix(id);
	const commit = useCommitStructure(id);
	const project = useProjectQuery(id).data;
	const navigate = useNavigate();
	const [selectionsBySheet, setSelectionsBySheet] = useState<
		Record<number, Array<BlockSelection>>
	>({});
	const [blocksBySheet, setBlocksBySheet] = useState<
		Record<number, Array<UnitMatrixBlock>>
	>({});
	const [preview, setPreview] = useState<UnitMatrixPreview>();
	const committed = useRef(false);
	useBlocker({
		shouldBlockFn: (): boolean =>
			Boolean(preview) &&
			!committed.current &&
			!window.confirm(t("projects.upload.editor.leave")),
		enableBeforeUnload: (): boolean => Boolean(preview) && !committed.current,
	});
	const [file, setFile] = useState<File>();
	const [error, setError] = useState<string>();
	const [sheetIndex, setSheetIndex] = useState(0);
	const sheet = preview?.sheets[sheetIndex];
	const blocks = blocksBySheet[sheetIndex] ?? sheet?.blocks ?? [];
	const selections =
		selectionsBySheet[sheetIndex] ??
		sheet?.blocks.map((block) => ({ name: block.name, included: true })) ??
		[];
	const headerErrors = blockNameErrors(selections);
	const selectedBlocks = blocks.flatMap((block, index) =>
		selections[index]?.included
			? [{ ...block, name: selections[index].name }]
			: []
	);
	const structure = matrixToStructure(selectedBlocks);
	const hardErrors = matrixErrors(selectedBlocks);
	const omitted = omittedStoreys(selectedBlocks);
	const unitCount = structure.blocks.reduce(
		(sum, block) =>
			sum +
			block.storeys.reduce((count, storey) => count + storey.units.length, 0),
		0
	);
	const invalid =
		hardErrors.length > 0 ||
		!structure.blocks.length ||
		structure.blocks.length > 50 ||
		unitCount > 10000 ||
		headerErrors.some(Boolean);
	const blockCount = project?.blocks.length ?? 0;
	const conflictCount =
		commit.error instanceof ApiRequestError &&
		typeof commit.error.details === "object" &&
		commit.error.details !== null &&
		"blockCount" in commit.error.details
			? Number(commit.error.details.blockCount)
			: blockCount;
	const errorMessage =
		error ??
		(parse.error
			? t(
					parse.error instanceof ApiRequestError &&
						parse.error.code === "UNIT_MATRIX_UNREADABLE"
						? "projects.upload.unreadable"
						: parse.error instanceof ApiRequestError &&
							  parse.error.code === "BAD_REQUEST"
							? "projects.upload.invalid"
							: "projects.upload.error"
				)
			: undefined);
	return (
		<section className="min-w-0 space-y-5">
			<h2 className="text-2xl">{t("projects.upload.title")}</h2>
			<form
				className="space-y-3"
				onSubmit={(event): void => {
					event.preventDefault();
					setError(undefined);
					if (!file) {
						setError(t("projects.upload.missing"));
						return;
					}
					if (!/\.xlsx?$/i.test(file.name) || file.size > 10 * 1024 * 1024) {
						setError(t("projects.upload.invalid"));
						return;
					}
					if (preview && !window.confirm(t("projects.upload.editor.replace")))
						return;
					parse.mutate(file, {
						onSuccess: (preview): void => {
							setPreview(preview);
							setSelectionsBySheet({});
							setBlocksBySheet({});
							committed.current = false;
							commit.reset();
							setSheetIndex(
								Math.max(
									0,
									preview.sheets.findIndex((entry) => entry.blocks.length > 0)
								)
							);
						},
					});
				}}
			>
				<label className="block" htmlFor="unit-matrix-file">
					{t("projects.upload.file")}
				</label>
				<input
					accept=".xls,.xlsx"
					aria-describedby="unit-matrix-hint"
					className="block w-full min-w-0 text-sm"
					disabled={parse.isPending || commit.isPending}
					id="unit-matrix-file"
					type="file"
					onChange={(event): void => {
						setFile(event.target.files?.[0]);
						setError(undefined);
					}}
				/>
				<p className="text-sm" id="unit-matrix-hint">
					{t("projects.upload.hint")}
				</p>
				<Button
					disabled={commit.isPending}
					pending={parse.isPending}
					type="submit"
				>
					{t("projects.upload.parse")}
				</Button>
			</form>
			{parse.isPending && <p role="status">{t("projects.upload.parsing")}</p>}
			{errorMessage && <p role="alert">{errorMessage}</p>}
			{preview && !parse.isPending && (
				<>
					<label className="block" htmlFor="unit-matrix-sheet">
						{t("projects.upload.sheet")}
					</label>
					<select
						className="max-w-full border border-rule p-2"
						disabled={commit.isPending}
						id="unit-matrix-sheet"
						value={sheetIndex}
						onChange={(event): void => {
							setSheetIndex(Number(event.target.value));
						}}
					>
						{preview.sheets.map((entry, index) => (
							<option key={index} value={index}>
								{t("projects.upload.sheetOption", {
									name: entry.name,
									count: entry.blocks.length,
								})}
							</option>
						))}
					</select>
					{sheet?.blocks.length ? (
						<>
							<UnitMatrixAccordion
								key={sheetIndex}
								errors={headerErrors}
								pending={commit.isPending}
								selections={selections}
								blocks={blocks.map((block, index) => ({
									...block,
									name: selections[index]?.name ?? block.name,
								}))}
								existingCodes={
									project?.unitTypes.map((type) => type.code) ?? []
								}
								onBlockChange={(index, next): void => {
									setBlocksBySheet((current) => ({
										...current,
										[sheetIndex]: blocks.map((block, blockIndex) =>
											blockIndex === index ? next : block
										),
									}));
									commit.reset();
								}}
								onSelectionChange={(index, selection): void => {
									setSelectionsBySheet((current) => ({
										...current,
										[sheetIndex]: selections.map((entry, entryIndex) =>
											entryIndex === index ? selection : entry
										),
									}));
									commit.reset();
								}}
							/>
							{hardErrors.length > 0 && (
								<ul
									aria-label={t("projects.upload.commitError")}
									className="list-disc pl-5"
									role="alert"
								>
									{hardErrors.map((error, index) => (
										<li key={index}>
											{error.block === undefined
												? t(`projects.upload.editor.errors.${error.code}`)
												: t("projects.upload.editor.errorAt", {
														block: selectedBlocks[error.block]?.name,
														row: error.row === undefined ? "—" : error.row + 1,
														stack:
															error.column === undefined
																? "—"
																: selectedBlocks[error.block]?.stacks[
																		error.column
																	],
														message: t(
															`projects.upload.editor.errors.${error.code}`
														),
													})}
										</li>
									))}
								</ul>
							)}
							{omitted.length > 0 && (
								<p>
									{t("projects.upload.editor.omitted", {
										names: omitted.join(", "),
									})}
								</p>
							)}
							{blockCount > 0 && (
								<p>{t("projects.upload.hasBlocks", { count: blockCount })}</p>
							)}
							{(structure.blocks.length > 50 || unitCount > 10000) && (
								<p role="alert">{t("projects.upload.caps")}</p>
							)}
							{commit.error && (
								<p role="alert">
									{t(
										commit.error instanceof ApiRequestError &&
											commit.error.code === "PROJECT_HAS_BLOCKS"
											? "projects.upload.hasBlocks"
											: "projects.upload.commitError",
										{ count: conflictCount }
									)}
								</p>
							)}
							<Button
								disabled={invalid || blockCount > 0}
								pending={commit.isPending}
								onClick={(): void => {
									commit.mutate(structure, {
										onSuccess: (created): void => {
											committed.current = true;
											void navigate({
												to: "/projects/$id",
												params: { id },
												search: {
													block: created.blocks[0]?.id,
													storey: created.blocks[0]?.storeys[0]?.id,
													imported: true,
													importedOmitted: omitted.length ? omitted : undefined,
													importedBlocks: created.blocks.length,
													importedStoreys: created.blocks.reduce(
														(sum, block) => sum + block.storeys.length,
														0
													),
													importedUnits: created.blocks.reduce(
														(sum, block) =>
															sum +
															block.storeys.reduce(
																(count, storey) => count + storey.units.length,
																0
															),
														0
													),
													importedTypes:
														created.unitTypes.length -
														(project?.unitTypes.length ?? 0),
												},
											});
										},
									});
								}}
							>
								{t("projects.upload.commit")}
							</Button>
						</>
					) : (
						<p>{t("projects.upload.empty")}</p>
					)}
				</>
			)}
		</section>
	);
};
