import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
import { useSubmission } from "@/features/projects/useSubmission";
/**
 * Confirms deleting a Catalogue Item no Unit holds; refusals are shown inline
 * on the row instead. Owns its submission: busy while `onConfirm` runs, its
 * failure line if it is rejected.
 */
export const DeleteCatalogueItemDialog = ({
	open,
	name,
	onCancel,
	onConfirm,
}: {
	open: boolean;
	name: string;
	onCancel: () => void;
	/** Deletes the Catalogue Item; a rejection is the failure, a resolution is the page's to close on. */
	onConfirm: () => Promise<void>;
}): React.ReactElement => {
	const { t } = useTranslation();
	const { pending, error, submit } = useSubmission<void>(
		t("projects.items.deleteError")
	);
	return (
		<Dialog
			open={open}
			title={t("projects.items.deleteTitle")}
			onClose={(): void => {
				if (!pending) onCancel();
			}}
		>
			<p className="mb-5 text-sm">
				{t("projects.items.deleteConfirmation", { name })}
			</p>
			{error && <Alert>{error}</Alert>}
			<div className="mt-5 flex justify-end gap-3">
				<Button
					data-autofocus
					disabled={pending}
					variant="secondary"
					onClick={onCancel}
				>
					{t("projects.items.cancel")}
				</Button>
				<Button
					pending={pending}
					onClick={(): void => {
						void submit(onConfirm);
					}}
				>
					{t("projects.items.deleteConfirm")}
				</Button>
			</div>
		</Dialog>
	);
};
