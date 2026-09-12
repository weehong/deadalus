import { UnitMatrixEditor } from "@/features/projects/UnitMatrixEditor";
import {
	type BlockSelection,
	matrixErrors,
	newUnitTypeCodes,
} from "@/features/projects/matrix-to-structure";
import { useId, useState } from "react";
import { useTranslation } from "react-i18next";
import { UnitMatrixTable } from "@/features/projects/UnitMatrixTable";
import type { UnitMatrixBlock } from "@/features/projects/unitMatrixTypes";
export const UnitMatrixAccordion = ({
	blocks,
	selections,
	errors,
	pending,
	onSelectionChange,
	onBlockChange,
	existingCodes = [],
}: {
	blocks: Array<UnitMatrixBlock>;
	onBlockChange?: (index: number, block: UnitMatrixBlock) => void;
	existingCodes?: Array<string>;
	selections?: Array<BlockSelection>;
	errors?: Array<"invalid" | "duplicate" | undefined>;
	pending?: boolean;
	onSelectionChange?: (index: number, selection: BlockSelection) => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const prefix = useId();
	const [open, setOpen] = useState<number | null>(0);
	return (
		<div className="min-w-0 space-y-3">
			{blocks.map((block, index) => (
				<section key={index} className="min-w-0 border border-rule">
					{selections?.[index] && onSelectionChange && (
						<div className="space-y-2 border-b border-rule p-4">
							<label className="flex items-center gap-2">
								<input
									checked={selections[index].included}
									disabled={pending}
									type="checkbox"
									onChange={(event): void => {
										onSelectionChange(index, {
											...selections[index]!,
											included: event.target.checked,
										});
									}}
								/>
								{t("projects.upload.includeBlock", { index: index + 1 })}
							</label>
							<label className="block" htmlFor={`${prefix}-name-${index}`}>
								{t("projects.upload.blockName", { index: index + 1 })}
							</label>
							<input
								aria-invalid={Boolean(errors?.[index])}
								className="w-full border border-rule p-2"
								disabled={pending}
								id={`${prefix}-name-${index}`}
								value={selections[index].name}
								aria-describedby={
									errors?.[index] ? `${prefix}-error-${index}` : undefined
								}
								onChange={(event): void => {
									onSelectionChange(index, {
										...selections[index]!,
										name: event.target.value,
									});
								}}
							/>
							{errors?.[index] && (
								<p id={`${prefix}-error-${index}`} role="alert">
									{t(
										errors[index] === "duplicate"
											? "projects.upload.duplicateBlock"
											: "projects.upload.invalidBlock"
									)}
								</p>
							)}
						</div>
					)}
					<h3 className="m-0">
						<button
							aria-controls={`${prefix}-${index}`}
							aria-expanded={open === index}
							className="w-full p-4 text-left break-words"
							type="button"
							onClick={(): void => {
								setOpen(open === index ? null : index);
							}}
						>
							<span className="block text-lg font-semibold">{block.name}</span>{" "}
							<span className="text-sm">
								{t("projects.upload.counts", {
									storeys: block.storeys.length,
									units: block.unitCount,
									first: block.stacks[0] ?? "",
									last: block.stacks[block.stacks.length - 1] ?? "",
								})}
							</span>
							{block.warnings.length > 0 && (
								<span className="block text-sm text-amber-700">
									{t("projects.upload.warningCount", {
										count: block.warnings.length,
									})}
								</span>
							)}
						</button>
					</h3>
					{open === index && (
						<div id={`${prefix}-${index}`}>
							{block.warnings.length > 0 && (
								<ul className="list-disc space-y-1 px-8 pb-4 text-sm text-amber-800">
									{block.warnings.map((warning, warningIndex) => (
										<li key={warningIndex}>
											{t(`projects.upload.warnings.${warning.code}`, {
												label: warning.label ?? "",
											})}
										</li>
									))}
								</ul>
							)}
							{onBlockChange ? (
								<UnitMatrixEditor
									pending={pending}
									value={block}
									errors={
										selections?.[index]?.included === false
											? []
											: matrixErrors([block])
									}
									onChange={(next): void => {
										onBlockChange(index, next);
									}}
								/>
							) : (
								<UnitMatrixTable block={block} />
							)}
							{selections?.[index]?.included !== false && (
								<div className="space-y-2 p-4">
									<h4>{t("projects.upload.editor.newTypes")}</h4>
									{newUnitTypeCodes(block, existingCodes).length ? (
										<ul
											aria-label={t("projects.upload.editor.newTypes")}
											className="flex flex-wrap gap-2"
										>
											{newUnitTypeCodes(block, existingCodes).map((code) => (
												<li key={code} className="border border-rule px-2 py-1">
													{code}
												</li>
											))}
										</ul>
									) : (
										<p>{t("projects.upload.editor.noNewTypes")}</p>
									)}
								</div>
							)}
						</div>
					)}
				</section>
			))}
		</div>
	);
};
