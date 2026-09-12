import { useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { UnitSelection } from "@/features/projects/UnitSelection";
import { previewAssignment } from "@/features/projects/assignment-preview";
import type { BulkAssignBody } from "@/features/projects/assignmentsApi";
import type { CatalogueItem, Project } from "@/features/projects/types";
import {
	isValidSelection,
	selectAll,
	selectUnits,
	toUnitSelectionBody,
} from "@/features/projects/unit-selection";
import { useSubmission } from "@/features/projects/useSubmission";

export interface SubcontractorOption {
	id: string;
	name: string;
}
export interface AssignResult {
	assigned: number;
	skipped: number;
}
const UNASSIGN = "__unassign__";
const inputClass =
	"min-h-10 w-full border border-rule bg-surface px-2.5 text-sm";

/**
 * Assigns a Catalogue Item's Items across a set of Units to one
 * Subcontractor found in the Directory, or unassigns them; the count line
 * says exactly what one click does, then what the API did. Owns its
 * submission: busy while `onSubmit` runs, its failure line if refused.
 */
export const AssignCatalogueItemDialog = ({
	project,
	catalogueItem,
	subcontractors,
	searching = false,
	onSearch,
	onSubmit,
	onClose,
}: {
	project: Project;
	catalogueItem: CatalogueItem;
	/** The Directory rows matching the current search. */
	subcontractors: Array<SubcontractorOption>;
	searching?: boolean;
	onSearch: (query: string) => void;
	/** Assigns across the selection and answers with the API's counts; a rejection is the failure. */
	onSubmit: (body: BulkAssignBody) => Promise<AssignResult>;
	onClose: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const searchId = useId();
	const targetId = useId();
	const { pending, error, result, submit } = useSubmission<AssignResult>(
		t("projects.assign.error")
	);
	const [value, setValue] = useState(() => selectAll(project, null));
	const [search, setSearch] = useState("");
	// "" means none chosen yet, UNASSIGN removes the Assignment, anything else is a Subcontractor id.
	const [target, setTarget] = useState("");
	const [chosen, setChosen] = useState<SubcontractorOption>();
	const [reassign, setReassign] = useState(false);
	const closeButton = useRef<HTMLButtonElement>(null);
	// The Assign button gives way to Close once the counts are in; keep focus in the dialog.
	useEffect(() => {
		if (result) closeButton.current?.focus();
	}, [result]);
	const unassigning = target === UNASSIGN;
	const subcontractorId = unassigning || target === "" ? null : target;
	const selection = toUnitSelectionBody(project, value);
	const valid = isValidSelection(selection) && target !== "";
	const selected = isValidSelection(selection)
		? selectUnits(project, selection)
		: [];
	const preview = previewAssignment(
		selected,
		catalogueItem.id,
		subcontractorId
	);
	const summary = result
		? t("projects.assign.result", {
				done: t(
					unassigning
						? "projects.assign.unassigned"
						: "projects.assign.assigned",
					{ count: result.assigned }
				),
				skipped: result.skipped,
			})
		: target === ""
			? t("projects.assign.chooseFirst")
			: unassigning
				? t("projects.assign.preview", {
						assign: t("projects.assign.willUnassign", {
							count: preview.elsewhere,
						}),
						elsewhere: t("projects.assign.unassignedSkipped", {
							count: preview.unassigned,
						}),
					})
				: t(
						preview.same > 0
							? "projects.assign.previewSame"
							: "projects.assign.preview",
						{
							assign: t("projects.assign.willAssign", {
								count: preview.unassigned,
							}),
							elsewhere: t(
								reassign
									? "projects.assign.elsewhereReassigned"
									: "projects.assign.elsewhereSkipped",
								{ count: preview.elsewhere }
							),
							same: t("projects.assign.same", {
								count: preview.same,
								name: chosen?.name ?? "",
							}),
						}
					);
	// The chosen Subcontractor stays selectable after the search moves on.
	const options =
		chosen && !subcontractors.some((entry) => entry.id === chosen.id)
			? [chosen, ...subcontractors]
			: subcontractors;
	const disabled = pending || result !== undefined;
	const close = (): void => {
		if (!pending) onClose();
	};
	return (
		<Dialog
			open
			title={t("projects.assign.title", { name: catalogueItem.name })}
			onClose={close}
		>
			<div className="grid gap-4">
				<div className="grid gap-[5px]">
					<label className="text-xs text-ink/70" htmlFor={searchId}>
						{t("projects.assign.search")}
					</label>
					<input
						className={inputClass}
						disabled={disabled}
						id={searchId}
						type="search"
						value={search}
						onChange={(event) => {
							setSearch(event.target.value);
							onSearch(event.target.value);
						}}
					/>
					{searching ? (
						<p className="m-0 text-xs text-ink/70">
							{t("projects.assign.searching")}
						</p>
					) : subcontractors.length === 0 ? (
						<p className="m-0 text-xs text-ink/70">
							{t("projects.assign.noMatches")}
						</p>
					) : null}
				</div>
				<div className="grid gap-[5px]">
					<label className="text-xs text-ink/70" htmlFor={targetId}>
						{t("projects.assign.subcontractor")}
					</label>
					<select
						className={inputClass}
						disabled={disabled}
						id={targetId}
						value={target}
						onChange={(event) => {
							const next = event.target.value;
							setTarget(next);
							if (next !== "" && next !== UNASSIGN)
								setChosen(options.find((entry) => entry.id === next));
						}}
					>
						<option value="">{t("projects.assign.choose")}</option>
						<option value={UNASSIGN}>{t("projects.assign.unassign")}</option>
						{options.map((entry) => (
							<option key={entry.id} value={entry.id}>
								{entry.name}
							</option>
						))}
					</select>
				</div>
				<label className="flex min-h-10 items-center gap-2 text-sm">
					<input
						checked={reassign}
						disabled={disabled || unassigning}
						type="checkbox"
						onChange={(event) => {
							setReassign(event.target.checked);
						}}
					/>
					{t("projects.assign.reassign")}
				</label>
				<UnitSelection
					disabled={disabled}
					project={project}
					summary={summary}
					value={value}
					onChange={setValue}
				/>
			</div>
			{error && (
				<div className="mt-4">
					<Alert>{error}</Alert>
				</div>
			)}
			<div className="mt-5 flex justify-end gap-3">
				{result ? (
					<Button ref={closeButton} onClick={onClose}>
						{t("projects.assign.close")}
					</Button>
				) : (
					<>
						<Button disabled={pending} variant="secondary" onClick={onClose}>
							{t("projects.assign.cancel")}
						</Button>
						<Button
							disabled={!valid}
							pending={pending}
							onClick={(): void => {
								void submit(() =>
									onSubmit({
										catalogueItemId: catalogueItem.id,
										subcontractorId,
										...(reassign && !unassigning ? { reassign: true } : {}),
										...selection,
									})
								);
							}}
						>
							{t(
								unassigning
									? "projects.assign.submitUnassign"
									: "projects.assign.submit"
							)}
						</Button>
					</>
				)}
			</div>
		</Dialog>
	);
};
