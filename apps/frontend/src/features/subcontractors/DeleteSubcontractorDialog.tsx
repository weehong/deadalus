import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

export const DeleteSubcontractorDialog = ({
	open,
	name,
	memberCount,
	assignedItemCount,
	pending,
	error,
	onCancel,
	onConfirm,
}: {
	open: boolean;
	name: string;
	memberCount: number;
	/** The API's refusal: Items still assigned to the Subcontractor. */
	assignedItemCount?: number;
	pending: boolean;
	error: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<Dialog
			open={open}
			title={t("subcontractors.delete.title")}
			onClose={(): void => {
				if (!pending) onCancel();
			}}
		>
			<p className="mb-5 text-sm text-ink">
				{t("subcontractors.delete.confirmation", { name, count: memberCount })}
			</p>
			{assignedItemCount !== undefined && assignedItemCount > 0 ? (
				<Alert>
					{t("subcontractors.delete.hasAssignments", {
						count: assignedItemCount,
					})}
				</Alert>
			) : (
				error && <Alert>{t("subcontractors.delete.error")}</Alert>
			)}
			<div className="mt-5 flex flex-wrap justify-end gap-3">
				<Button
					data-autofocus
					disabled={pending}
					variant="secondary"
					onClick={onCancel}
				>
					{t("subcontractors.delete.cancel")}
				</Button>
				<Button pending={pending} onClick={onConfirm}>
					{t("subcontractors.delete.confirm")}
				</Button>
			</div>
		</Dialog>
	);
};
