import { useId, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Project } from "@/features/projects/types";
import {
	storeysOf,
	type UnitSelectionValue,
} from "@/features/projects/unit-selection";

const CheckboxList = ({
	legend,
	selectAllLabel,
	options,
	selected,
	disabled,
	onChange,
}: {
	legend: string;
	selectAllLabel: string;
	options: Array<{ id: string; label: string }>;
	selected: Array<string>;
	disabled: boolean;
	onChange: (ids: Array<string>) => void;
}): React.ReactElement => (
	<fieldset className="min-w-0" disabled={disabled}>
		<legend className="text-xs text-ink/70">{legend}</legend>
		<label className="flex min-h-10 items-center gap-2 text-sm font-semibold">
			<input
				type="checkbox"
				checked={
					options.length > 0 &&
					options.every((option) => selected.includes(option.id))
				}
				onChange={(event) => {
					onChange(event.target.checked ? options.map((o) => o.id) : []);
				}}
			/>
			{selectAllLabel}
		</label>
		<div className="flex max-h-48 flex-wrap gap-x-4 overflow-y-auto">
			{options.map((option) => (
				<label
					key={option.id}
					className="flex min-h-10 items-center gap-2 text-sm"
				>
					<input
						checked={selected.includes(option.id)}
						type="checkbox"
						onChange={(event) => {
							// Keep the options' order so the request lists read as the Structure does.
							onChange(
								options
									.map((held) => held.id)
									.filter((id) =>
										id === option.id
											? event.target.checked
											: selected.includes(id)
									)
							);
						}}
					/>
					{option.label}
				</label>
			))}
		</div>
	</fieldset>
);

/**
 * The Unit selection shared by apply, remove and bulk assign: one Block or
 * all, then Storeys and Unit Types with select-all, over a plain value. The
 * caller words the live `summary` line from the loaded Project.
 */
export const UnitSelection = ({
	project,
	value,
	summary,
	disabled = false,
	onChange,
}: {
	project: Project;
	value: UnitSelectionValue;
	/** What the selection will do, computed by the caller; announced as it changes. */
	summary: ReactNode;
	disabled?: boolean;
	onChange: (value: UnitSelectionValue) => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const blockId = useId();
	const storeys = storeysOf(project, value.blockId);
	return (
		<div className="grid gap-4">
			<div className="grid gap-[5px]">
				<label className="text-xs text-ink/70" htmlFor={blockId}>
					{t("projects.selection.block")}
				</label>
				<select
					className="min-h-10 w-full border border-rule bg-surface px-2.5 text-sm"
					disabled={disabled}
					id={blockId}
					value={value.blockId ?? ""}
					onChange={(event) => {
						const next = event.target.value || null;
						onChange({
							...value,
							blockId: next,
							storeyIds: storeysOf(project, next).map((storey) => storey.id),
						});
					}}
				>
					<option value="">{t("projects.selection.allBlocks")}</option>
					{project.blocks.map((block) => (
						<option key={block.id} value={block.id}>
							{block.name}
						</option>
					))}
				</select>
			</div>
			<CheckboxList
				disabled={disabled}
				legend={t("projects.selection.storeys")}
				selectAllLabel={t("projects.selection.allStoreys")}
				selected={value.storeyIds}
				options={storeys.map((storey) => ({
					id: storey.id,
					label:
						value.blockId === null
							? t("projects.selection.storeyOfBlock", {
									block: storey.blockName,
									storey: storey.name,
								})
							: storey.name,
				}))}
				onChange={(storeyIds) => {
					onChange({ ...value, storeyIds });
				}}
			/>
			{project.unitTypes.length > 0 && (
				<CheckboxList
					disabled={disabled}
					legend={t("projects.selection.unitTypes")}
					selectAllLabel={t("projects.selection.allUnitTypes")}
					selected={value.unitTypeIds}
					options={project.unitTypes.map((type) => ({
						id: type.id,
						label: type.code,
					}))}
					onChange={(unitTypeIds) => {
						onChange({ ...value, unitTypeIds });
					}}
				/>
			)}
			<p aria-live="polite" className="m-0 text-sm" role="status">
				{summary}
			</p>
		</div>
	);
};
