import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { UnitSelection } from "@/features/projects/UnitSelection";
import type { CatalogueItem, Project } from "@/features/projects/types";
import {
	holdingCount,
	isValidSelection,
	selectAll,
	selectUnits,
	toUnitSelectionBody,
	type UnitSelectionBody,
} from "@/features/projects/unit-selection";
import { useSubmission } from "@/features/projects/useSubmission";

export interface ApplyResult {
	added: number;
	skipped: number;
}

/**
 * Applies a Catalogue Item to a set of Units: the selection with a live line
 * saying what one click does, then the counts the API answered with. Owns
 * its submission: busy while `onSubmit` runs, its failure line if refused.
 */
export const ApplyCatalogueItemDialog = ({
	project,
	catalogueItem,
	onSubmit,
	onClose,
}: {
	project: Project;
	catalogueItem: CatalogueItem;
	/** Applies across the selection and answers with the API's counts; a rejection is the failure. */
	onSubmit: (body: UnitSelectionBody) => Promise<ApplyResult>;
	onClose: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const [value, setValue] = useState(() => selectAll(project, null));
	const { pending, error, result, submit } = useSubmission<ApplyResult>(
		t("projects.apply.error")
	);
	const closeButton = useRef<HTMLButtonElement>(null);
	// The Apply button gives way to Close once the counts are in; keep focus in the dialog.
	useEffect(() => {
		if (result) closeButton.current?.focus();
	}, [result]);
	const body = toUnitSelectionBody(project, value);
	const valid = isValidSelection(body);
	const selected = valid ? selectUnits(project, body) : [];
	const hold = holdingCount(selected, catalogueItem.id);
	const preview = t("projects.apply.preview", {
		add: t("projects.apply.add", { count: selected.length - hold }),
		hold: t("projects.apply.hold", { count: hold }),
	});
	const close = (): void => {
		if (!pending) onClose();
	};
	return (
		<Dialog
			open
			title={t("projects.apply.title", { name: catalogueItem.name })}
			onClose={close}
		>
			<UnitSelection
				disabled={pending || result !== undefined}
				project={project}
				value={value}
				summary={
					result
						? t("projects.apply.result", {
								added: t("projects.apply.added", { count: result.added }),
								skipped: t("projects.apply.skipped", { count: result.skipped }),
							})
						: preview
				}
				onChange={setValue}
			/>
			{error && (
				<div className="mt-4">
					<Alert>{error}</Alert>
				</div>
			)}
			<div className="mt-5 flex justify-end gap-3">
				{result ? (
					<Button ref={closeButton} onClick={onClose}>
						{t("projects.apply.close")}
					</Button>
				) : (
					<>
						<Button disabled={pending} variant="secondary" onClick={onClose}>
							{t("projects.apply.cancel")}
						</Button>
						<Button
							disabled={!valid}
							pending={pending}
							onClick={(): void => {
								void submit(() => onSubmit(body));
							}}
						>
							{t("projects.apply.submit")}
						</Button>
					</>
				)}
			</div>
		</Dialog>
	);
};
