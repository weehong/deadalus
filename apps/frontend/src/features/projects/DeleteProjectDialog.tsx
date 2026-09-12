import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

export const DeleteProjectDialog = ({
	open,
	name,
	blockCount,
	storeyCount,
	unitCount,
	pending,
	error,
	onCancel,
	onConfirm,
}: {
	open: boolean;
	name: string;
	blockCount: number;
	storeyCount: number;
	unitCount: number;
	pending: boolean;
	error: boolean;
	onCancel: () => void;
	onConfirm: () => void;
}): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<Dialog
			open={open}
			title={t("projects.delete.title")}
			onClose={(): void => {
				if (!pending) onCancel();
			}}
		>
			<p className="mb-5 text-sm text-ink">
				{t("projects.delete.confirmation", {
					name,
					blockCount,
					storeyCount,
					unitCount,
				})}
			</p>
			{error && <Alert>{t("projects.delete.error")}</Alert>}
			<div className="mt-5 flex flex-wrap justify-end gap-3">
				<Button
					data-autofocus
					disabled={pending}
					variant="secondary"
					onClick={onCancel}
				>
					{t("projects.delete.cancel")}
				</Button>
				<Button pending={pending} onClick={onConfirm}>
					{t("projects.delete.confirm")}
				</Button>
			</div>
		</Dialog>
	);
};
