import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { UnitSelection } from "@/features/projects/UnitSelection";
import type { CatalogueItem, Project } from "@/features/projects/types";
import {
	isValidSelection,
	removalCounts,
	selectAll,
	selectUnits,
	toUnitSelectionBody,
	type UnitSelectionBody,
} from "@/features/projects/unit-selection";
import { useSubmission } from "@/features/projects/useSubmission";

export interface RemoveResult {
	removed: number;
	entriesRemoved: number;
}

/**
 * Removes a Catalogue Item's Items from a set of Units: the selection with a
 * live Item count, then a confirmation naming the Items and the Progress
 * entries that go with them, then the counts the API answered with. Owns
 * its submission: busy while `onSubmit` runs, its failure line if refused.
 */
export const RemoveCatalogueItemDialog = ({
	project,
	catalogueItem,
	defaultConfirming = false,
	onSubmit,
	onClose,
}: {
	project: Project;
	catalogueItem: CatalogueItem;
	/** Open on the confirmation step; for the story of that state. */
	defaultConfirming?: boolean;
	/** Removes across the selection and answers with the API's counts; a rejection is the failure. */
	onSubmit: (body: UnitSelectionBody) => Promise<RemoveResult>;
	onClose: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	const [value, setValue] = useState(() => selectAll(project, null));
	const [confirming, setConfirming] = useState(defaultConfirming);
	const { pending, error, result, submit } = useSubmission<RemoveResult>(
		t("projects.removeItems.error")
	);
	const closeButton = useRef<HTMLButtonElement>(null);
	// The Remove button gives way to Close once the counts are in; keep focus in the dialog.
	useEffect(() => {
		if (result) closeButton.current?.focus();
	}, [result]);
	const body = toUnitSelectionBody(project, value);
	const valid = isValidSelection(body);
	const counts = removalCounts(
		valid ? selectUnits(project, body) : [],
		catalogueItem.id
	);
	const items = t("projects.removeItems.items", { count: counts.items });
	const summary = result
		? t("projects.removeItems.result", {
				items: t("projects.removeItems.items", { count: result.removed }),
				entries: t("projects.removeItems.entries", {
					count: result.entriesRemoved,
				}),
			})
		: confirming
			? t("projects.removeItems.confirm", {
					items,
					entries: t("projects.removeItems.entries", {
						count: counts.entries,
					}),
				})
			: t("projects.removeItems.preview", { count: counts.items });
	const close = (): void => {
		if (!pending) onClose();
	};
	return (
		<Dialog
			open
			title={t("projects.removeItems.title", { name: catalogueItem.name })}
			onClose={close}
		>
			<UnitSelection
				disabled={pending || confirming || result !== undefined}
				project={project}
				summary={summary}
				value={value}
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
						{t("projects.removeItems.close")}
					</Button>
				) : confirming ? (
					<>
						<Button
							disabled={pending}
							variant="secondary"
							onClick={(): void => {
								setConfirming(false);
							}}
						>
							{t("projects.removeItems.back")}
						</Button>
						<Button
							pending={pending}
							onClick={(): void => {
								void submit(() => onSubmit(body));
							}}
						>
							{t("projects.removeItems.submit")}
						</Button>
					</>
				) : (
					<>
						<Button disabled={pending} variant="secondary" onClick={onClose}>
							{t("projects.removeItems.cancel")}
						</Button>
						<Button
							disabled={!valid || pending}
							onClick={(): void => {
								setConfirming(true);
							}}
						>
							{t("projects.removeItems.continue")}
						</Button>
					</>
				)}
			</div>
		</Dialog>
	);
};
