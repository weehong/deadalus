import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Alert } from "@/components/ui/Alert";
export const DeleteUnitTypeDialog = ({
	open,
	code,
	pending,
	error,
	onCancel,
	onConfirm,
}: {
	open: boolean;
	code: string;
	pending: boolean;
	error?: string;
	onCancel: () => void;
	onConfirm: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<Dialog
			open={open}
			title={t("projects.unitTypes.deleteTitle")}
			onClose={(): void => {
				if (!pending) onCancel();
			}}
		>
			<p className="mb-5 text-sm">
				{t("projects.unitTypes.deleteConfirmation", { code })}
			</p>
			{error && <Alert>{error}</Alert>}
			<div className="mt-5 flex justify-end gap-3">
				<Button
					data-autofocus
					disabled={pending}
					variant="secondary"
					onClick={onCancel}
				>
					{t("projects.unitTypes.cancel")}
				</Button>
				<Button pending={pending} onClick={onConfirm}>
					{t("projects.unitTypes.deleteConfirm")}
				</Button>
			</div>
		</Dialog>
	);
};
